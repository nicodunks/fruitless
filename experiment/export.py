"""Export measured spike bins and real positions for the local viewer."""
import argparse,json
from pathlib import Path
import numpy as np
p=argparse.ArgumentParser();p.add_argument('data',type=Path);args=p.parse_args();root=args.data
out=Path(__file__).parent;report=json.loads((out/'results.json').read_text());ids=np.load(root/'full-nodes.npz')['ids'];lookup={int(i):j for j,i in enumerate(ids)}
positions=np.full((len(ids),3),np.nan,dtype='<f4')
for r in json.loads((root/'full-positions.json').read_text()):positions[lookup[r['id']]]=r['position']
positions.tofile(out/'positions.f32');ids.astype('<u4').tofile(out/'neuron-ids.u32')
recordings={}
for result in report['results']:
 d=np.load(root/(result['key']+'.npz'));events=np.column_stack([d['bin'],d['neuron'],d['count']])
 assert int(events[:,2].sum())==result['spikes']
 recordings[result['key']]=events.tolist()
(out/'recordings.json').write_text(json.dumps(recordings,separators=(',',':')))
lines=['# Full-connectome pilot results','',
 '**No mAL-dependent P1-related response was observed. This pilot does not demonstrate mate preference or reproduce the courtship result.**','',
 'The full classified MaleCNS v1.0 graph contains 166,606 neurons and 25,574,615 neuron-to-neuron connections, representing 124,144,950 anatomical synapse counts. All those edges are retained; 1,112,336 have zero modeled fast weight under the conservative transmitter assumptions. The model is a short, simplified LIF simulation, not a complete physiological fly.','',
 'All 24 primary/sensitivity trials had zero mAL and zero P1-related spikes. The seed-1 PPN1 control recruited 3,461 neurons but also produced zero mAL/P1-related spikes. Therefore the intended circuit mechanism was not functionally recruited in this model. This is a model/input/parameter limitation, not evidence against the biological study.','',
 '| Sign setting | Candidate input | Seed | Intact P1-related Hz | mAL blocked Hz | Intact active neurons | Blocked active neurons |','|---|---|---:|---:|---:|---:|---:|']
for a in report['results']:
 if a['input'].startswith('candidate') and a['condition']=='intact':
  b=next(b for b in report['results'] if b['setting']==a['setting'] and b['input']==a['input'] and b['seed']==a['seed'] and b['condition']=='mAL_blocked')
  lines.append(f"| {a['setting']} | {a['input']} | {a['seed']} | {a['rates_hz']['P1_related']:.3f} | {b['rates_hz']['P1_related']:.3f} | {a['active_neurons']} | {b['active_neurons']} |")
lines+=['','Restoration reproduced intact activity exactly for all four seed-1 comparisons. No-input control remained silent. Each intervention pair received identical external events. Small-network checks verified excitation, inhibition, output block, and silence from rest. These are software checks, not biological validation.','',
 f"31 full-network trials completed in {report['wall_seconds']:.1f} seconds after preparation/JIT compilation. Each trial was 300 ms of model time. Three seeds are technical replicates, not biological samples.",'',
 f"The viewer includes {np.isfinite(positions[:,0]).sum():,} actual soma positions. Other cells remain in the simulation and recordings but cannot be drawn at a soma location. Animation shows 10 ms spike-count bins over a 10-second loop (33.3× slower); color decay is a display effect, not modeled conduction. All trials are exported, with seed 1 selected by default before outcomes.",'',
 'Interpretation: sparse recruitment and a silent intended readout mean this pilot cannot support a male/female comparison of courtship. Do not use downstream network recruitment as a preference proxy. Next scientific step would be auditing sensory-to-PPN1/mAL/pC1 paths, receptor signs, and the readout population; not choosing a gain or threshold to force mounting.','',
 'See [PROTOCOL.md](PROTOCOL.md) for fixed assumptions, sources and controls; [results.json](results.json) for exact values and provenance.']
(out/'RESULTS.md').write_text('\n'.join(lines)+'\n')
print('Exported',len(recordings),'trials; soma positions',np.isfinite(positions[:,0]).sum())
