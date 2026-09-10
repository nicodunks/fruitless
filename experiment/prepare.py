"""Build the full annotated MaleCNS v1 graph, without a connection-weight cutoff."""
import argparse, hashlib, json
from pathlib import Path
from collections import Counter
import numpy as np
import pyarrow as pa
import pyarrow.compute as pc
import pyarrow.feather as feather
from scipy.sparse import csr_matrix, save_npz

p = argparse.ArgumentParser(); p.add_argument('data', type=Path); args = p.parse_args()
root = args.data
rows = feather.read_table(root/'annotations.feather').to_pylist()
rows = sorted((r for r in rows if r['superclass'] and 'tbc' not in r['superclass']), key=lambda r:r['bodyId'])
ids = np.array([r['bodyId'] for r in rows], dtype=np.int64)
nttable = feather.read_table(root/'nt.feather', columns=['body','consensus_nt'])
nttable = nttable.filter(pc.is_in(nttable['body'], pa.array(ids)))
nts = dict(zip(nttable['body'].to_pylist(), nttable['consensus_nt'].to_pylist()))
# Assumed fast signs, not measured receptor-specific physiology. Others have zero fast weight.
signs = np.array([{'acetylcholine':1,'gaba':-1,'glutamate':-1}.get(nts.get(int(i)),0) for i in ids],dtype=np.int8)
groups = {
 'candidate_male': [i for i,r in enumerate(rows) if r['type'] in ['LgLG6','LgLG7'] and r['entryNerve']=='ProLN'],
 'candidate_female': [i for i,r in enumerate(rows) if r['type'] in ['LgLG5','LgLG8'] and r['entryNerve']=='ProLN'],
 'mAL': [i for i,r in enumerate(rows) if (r['type'] or '').startswith('mAL_m') and nts.get(r['bodyId'])=='gaba'],
 'P1_related': [i for i,r in enumerate(rows) if (r['type'] or '').startswith('pC1_') and r['fruDsx']=='coexpress_high'],
 'PPN1': [i for i,r in enumerate(rows) if 'Kallman 2015: PPN1' in (r['synonyms'] or '')]
}
assert all(groups.values()) and len(set(ids))==len(ids)
print('Neurons',len(ids),'groups',{k:len(v) for k,v in groups.items()},flush=True)
# Filter one Arrow record batch at a time: the source includes many non-neuronal fragments.
source = pa.memory_map(str(root/'graph.feather'))
reader = pa.ipc.open_file(source)
pre, post, weights = [], [], []
for b in range(reader.num_record_batches):
 t = pa.Table.from_batches([reader.get_batch(b)])
 t = t.filter(pc.and_(pc.is_in(t['body_pre'],pa.array(ids)),pc.is_in(t['body_post'],pa.array(ids))))
 pre.append(np.searchsorted(ids,t['body_pre'].to_numpy()).astype(np.int32))
 post.append(np.searchsorted(ids,t['body_post'].to_numpy()).astype(np.int32))
 weights.append(t['weight'].to_numpy().astype(np.float32))
pre,post,weights=map(np.concatenate,(pre,post,weights))
assert np.all(weights>0)
graph=csr_matrix((weights,(pre,post)),shape=(len(ids),len(ids)));graph.sort_indices()
save_npz(root/'full-graph.npz',graph)
np.savez(root/'full-nodes.npz',ids=ids,signs=signs)
meta={'dataset':'male-cns:v1.0','neurons':len(ids),'edges':int(graph.nnz),'synapses':int(weights.sum(dtype=np.float64)),
 'selection':'Nonempty superclass excluding tbc, following the authors counting notebook; all such v1.0 rows retained, including isolated nodes. Counts differ from v0.9 paper.',
 'nt_counts':dict(Counter(nts.get(int(i)) or 'unknown' for i in ids)),
 'zero_fast_weight_neurons':int((signs==0).sum()),'zero_fast_weight_edges':int(np.diff(graph.indptr)[signs==0].sum()),
 'groups':groups,'group_annotations':{k:[{x:rows[i][x] for x in ['bodyId','type','receptorType','synonyms','entryNerve','fruDsx']} for i in v] for k,v in groups.items()},
 'sha256':{name:hashlib.file_digest(open(root/name,'rb'),'sha256').hexdigest() if hasattr(hashlib,'file_digest') else hashlib.sha256((root/name).read_bytes()).hexdigest() for name in ['annotations.feather','nt.feather','graph.feather']}}
(root/'full-meta.json').write_text(json.dumps(meta,indent=2))
# Real soma locations for rendering, with IDs so activity and anatomy cannot become misaligned.
positions=[{'id':int(ids[i]),'position':r['somaLocation']} for i,r in enumerate(rows) if r['somaLocation']]
(root/'full-positions.json').write_text(json.dumps(positions,separators=(',',':')))
print({k:v for k,v in meta.items() if k not in ['groups','group_annotations','sha256']},flush=True)
