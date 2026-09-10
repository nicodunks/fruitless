import json,time,hashlib
from pathlib import Path
import numpy as np
from scipy.sparse import load_npz
from numba import njit

# Same bounded-conductance equations as the independent brake sensitivity.
@njit(cache=True)
def run(indptr,dest,weights,signs,p1,mal,inputs,events,condition,ei,dt=.1):
 n=len(signs);steps=events.shape[0];delay=int(round(1.8/dt));ref=int(round(2.2/dt))
 v=np.full(n,-52.);ge=np.zeros(n);hi=np.zeros(n);release=np.zeros(n,np.int32)
 pending_e=np.zeros((delay+1,n));pending_i=np.zeros((delay+1,n))
 p1mask=np.zeros(n,np.bool_);p1mask[p1]=True;malmask=np.zeros(n,np.bool_);malmask[mal]=True;inputmask=np.zeros(n,np.bool_);inputmask[inputs]=True
 counts=np.zeros((int(np.ceil(steps*dt/10)),n),np.int32);eg=np.exp(-dt/5);vmin=-52.;vmax=-52.
 for step in range(steps):
  t=step*dt;slot=step%(delay+1);drive=0.
  for i in range(n):
   inc_e=pending_e[slot,i];inc_i=pending_i[slot,i];pending_e[slot,i]=0;pending_i[slot,i]=0
   if step>=release[i]:
    ge[i]+=inc_e;hi[i]+=inc_i
    rate=(1+hi[i])/20;decay=np.exp(-rate*dt)
    equilibrium=(-52+hi[i]*ei+(drive if p1mask[i] else 0))/(1+hi[i])
    coupling=(eg-decay)/(20*(rate-.2)) if abs(rate-.2)>1e-10 else dt*decay/20
    v[i]=equilibrium+(v[i]-equilibrium)*decay+ge[i]*coupling
    ge[i]*=eg;hi[i]*=eg
   vmin=min(vmin,v[i]);vmax=max(vmax,v[i])
  for j in range(len(inputs)):
   if events[step,j]:v[inputs[j]]+=68.75
  for i in range(n):
   if step>=release[i] and v[i]>-45:
    counts[int(t/10),i]+=1;v[i]=-52;ge[i]=0;hi[i]=0;release[i]=step+(0 if inputmask[i] else ref)
    if signs[i]==0 or (condition==2 and malmask[i]):continue
    slot2=(step+delay)%(delay+1)
    for e in range(indptr[i],indptr[i+1]):
     target=dest[e]
     if condition==3 and malmask[i] and p1mask[target]:continue
     if signs[i]>0:pending_e[slot2,target]+=weights[e]*.275
     else:pending_i[slot2,target]+=weights[e]*.275/(-52-ei)
 return counts,vmin,vmax

def main():
 import argparse
 p=argparse.ArgumentParser();p.add_argument('data',type=Path);a=p.parse_args();root=a.data;out=Path(__file__).parent
 meta=json.loads((root/'full-meta.json').read_text());D=np.load(root/'full-nodes.npz');ids=D['ids'];W=load_npz(root/'full-graph.npz');groups={k:np.array(v,np.int32) for k,v in meta['groups'].items()}
 groups['vAB3']=np.searchsorted(ids,[11998,13341,13693,512498]);p1=np.searchsorted(ids,[12442,16719,17867,20117,20803,23968,519518,522419]);mal=groups['mAL'];results=[];started=time.perf_counter()
 for ei in [-70.,-80.]:
  for pop in ['candidate_male','candidate_female','vAB3']:
   signs=D['signs'].copy();signs[groups['vAB3']]=1
   signs[groups['candidate_female']]=1
   inp=groups[pop];rate=150. if pop=='vAB3' else 5550/len(inp)
   for seed in [11,12,13]:
    events=np.zeros((3000,len(inp)),np.bool_);events[500:2500]=np.random.RandomState(seed).random_sample((2000,len(inp)))<rate*.1/1000
    digest=hashlib.sha256(events.tobytes()).hexdigest()
    for condition,name in [(1,'intact'),(2,'mAL_blocked')]:
     t=time.perf_counter();counts,vmin,vmax=run(W.indptr,W.indices,W.data,signs,p1,mal,inp,events,condition,ei)
     assert vmin>=ei-1e-8
     row={'reversal_mV':ei,'input':pop,'seed':seed,'condition':name,'events':int(events.sum()),'event_sha256':digest,'P1_spikes':int(counts[5:,p1].sum()),'P1_Hz':float(counts[5:,p1].sum()/8/.25),'broad_P1_spikes':int(counts[5:,groups['P1_related']].sum()),'mAL_spikes':int(counts[5:,mal].sum()),'voltage_min_mV':vmin,'network_spikes':int(counts.sum()),'seconds':time.perf_counter()-t};results.append(row);print(json.dumps(row),flush=True)
     b,i=np.nonzero(counts);np.savez_compressed(root/f'bounded_route_{int(ei)}_{pop}_{name}_{seed}.npz',bin=b.astype(np.uint8),neuron=i.astype(np.int32),count=counts[b,i])
 report={'code_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'protocol_sha256':hashlib.sha256((out/'BOUNDED_ROUTE_PROTOCOL.md').read_bytes()).hexdigest(),'results':results,'seconds':time.perf_counter()-started}
 (out/'bounded-route-results.json').write_text(json.dumps(report,indent=2));print('COMPLETE',report['seconds'],flush=True)
if __name__=='__main__':main()
