"""Full-network artificial P1/mAL coactivation assay; see BRAKE_PROTOCOL.md."""
import argparse,hashlib,json,time
from pathlib import Path
import numpy as np
from numba import njit
from scipy.sparse import load_npz

@njit(cache=True)
def run(indptr,dest,weights,signs,p1,mal,events,tonic,condition,dt=.1):
 n=len(signs);steps=events.shape[0];delay=int(round(1.8/dt));ref=int(round(2.2/dt))
 v=np.full(n,-52.);g=np.zeros(n);release=np.zeros(n,np.int32);pending=np.zeros((delay+1,n))
 p1mask=np.zeros(n,np.bool_);p1mask[p1]=True;malmask=np.zeros(n,np.bool_);malmask[mal]=True
 counts=np.zeros((int(np.ceil(steps*dt/10)),n),np.int32)
 em=np.exp(-dt/20);eg=np.exp(-dt/5);coupling=5/15*(em-eg);vmin=-52.;vmax=-52.
 for step in range(steps):
  t=step*dt;slot=step%(delay+1);drive=tonic if 100<=t<600 else 0.
  for i in range(n):
   incoming=pending[slot,i];pending[slot,i]=0
   if step>=release[i]:
    g[i]+=incoming
    v[i]=-52+(v[i]+52)*em+g[i]*coupling+(drive*(1-em) if p1mask[i] else 0.)
    g[i]*=eg
   vmin=min(vmin,v[i]);vmax=max(vmax,v[i])
  if condition!=0:
   for j in range(len(mal)):
    if events[step,j]:v[mal[j]]+=68.75
  for i in range(n):
   if step>=release[i] and v[i]>-45:
    counts[int(t/10),i]+=1;v[i]=-52;g[i]=0;release[i]=step+(0 if malmask[i] and condition!=0 else ref)
    if signs[i]==0 or (condition==2 and malmask[i]):continue
    slot2=(step+delay)%(delay+1)
    for e in range(indptr[i],indptr[i+1]):
     if condition==3 and malmask[i] and p1mask[dest[e]]:continue
     pending[slot2,dest[e]]+=weights[e]*.275*signs[i]
 return counts,vmin,vmax

def main():
 parser=argparse.ArgumentParser();parser.add_argument('data',type=Path);args=parser.parse_args();root=args.data;out=Path(__file__).parent
 meta=json.loads((root/'full-meta.json').read_text());data=np.load(root/'full-nodes.npz');ids=data['ids'];signs=data['signs'];W=load_npz(root/'full-graph.npz')
 p1ids=np.array([12442,16719,17867,20117,20803,23968,519518,522419]);p1=np.searchsorted(ids,p1ids);assert np.array_equal(ids[p1],p1ids)
 mal=np.array(meta['groups']['mAL'],np.int32);secondary=np.array(meta['groups']['P1_related'],np.int32)
 names=['tonic_only','mAL_activated','all_mAL_output_blocked','direct_mAL_P1_blocked'];rows=[];started=time.perf_counter();cached=None
 def trial(drive,seed,phase):
  events=np.random.default_rng(seed).random((7000,len(mal)))<.015;events[:1000]=False;events[6000:]=False
  digest=hashlib.sha256(events.tobytes()).hexdigest()
  for condition,name in enumerate(names):
   begin=time.perf_counter();counts,vmin,vmax=run(W.indptr,W.indices,W.data,signs,p1,mal,events,drive,condition)
   row={'phase':phase,'drive_mV':drive,'seed':seed,'condition':name,'external_schedule_sha256':digest,'primary_Hz':float(counts[10:60,p1].sum()/8/.5),'primary_active':int(np.any(counts[10:60,p1],axis=0).sum()),'secondary_Hz':float(counts[10:60,secondary].sum()/len(secondary)/.5),'mAL_Hz':float(counts[10:60,mal].sum()/len(mal)/.5),'network_spikes':int(counts.sum()),'active_neurons':int(np.any(counts,axis=0).sum()),'voltage_min_mV':vmin,'voltage_max_before_external_mV':vmax,'seconds':time.perf_counter()-begin}
   rows.append(row);print(json.dumps(row),flush=True)
   if seed==1:
    b,i=np.nonzero(counts);np.savez_compressed(root/f'brake_{drive}_{name}.npz',bin=b.astype(np.uint8),neuron=i.astype(np.int32),count=counts[b,i])
   if seed==1 and drive==10 and condition==1:
    repeat,_,_=run(W.indptr,W.indices,W.data,signs,p1,mal,events,drive,1)
    assert np.array_equal(counts,repeat),'Restored configuration not reproducible'
 for drive in [8.,10.,14.]:
  for seed in range(1,6):trial(drive,seed,'fixed_grid')
 for seed in range(101,111):trial(10.,seed,'confirmation')
 # Controls include all four conditions for consistency, with tonic current zero.
 trial(0.,1,'zero_tonic_controls')
 assert next(r for r in rows if r['phase']=='zero_tonic_controls' and r['condition']=='tonic_only')['network_spikes']==0
 report={'protocol_sha256':hashlib.sha256((out/'BRAKE_PROTOCOL.md').read_bytes()).hexdigest(),'code_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'primary_body_ids':p1ids.tolist(),'neurons':len(ids),'edges':W.nnz,'results':rows,'seconds':time.perf_counter()-started,'checks':{'restored_configuration_exact':True,'zero_input_silent':True}}
 (out/'brake-results.json').write_text(json.dumps(report,indent=2));print('COMPLETE',report['seconds'],flush=True)
if __name__=='__main__':main()
