"""Small full-network LIF experiment. See PROTOCOL.md; no fitted behavior decoder."""
import argparse, json, time, hashlib
from pathlib import Path
import numpy as np
from scipy.sparse import load_npz
from numba import njit

@njit(cache=True)
def simulate(indptr, targets, weights, signs, inputs, input_hz, blocked, seed, duration=300., dt=.1):
    n=len(signs); steps=int(round(duration/dt)); delay=int(round(1.8/dt)); refractory=int(round(2.2/dt))
    v=np.full(n,-52.); g=np.zeros(n); release=np.zeros(n,np.int32)
    pending=np.zeros((delay+1,n)); bins=np.zeros((int(np.ceil(duration/10)),n),np.int32)
    driven=np.zeros(n,np.bool_); driven[inputs]=True
    np.random.seed(seed)
    # Exact solution of the two linear ODEs during each non-refractory step.
    em=np.exp(-dt/20); eg=np.exp(-dt/5); coupling=5/15*(em-eg)
    event_count=0
    for step in range(steps):
        t=step*dt; slot=step%(delay+1)
        for i in range(n):
            g[i]+=pending[slot,i];pending[slot,i]=0
            if step>=release[i]:
                v[i]=-52+(v[i]+52)*em+g[i]*coupling
                g[i]*=eg
        if 50<=t<250:
            for i in inputs:
                if np.random.random()<input_hz*dt/1000:
                    v[i]+=68.75;event_count+=1
        for i in range(n):
            if step>=release[i] and v[i]>-45:
                bins[min(int(t/10),bins.shape[0]-1),i]+=1
                v[i]=-52;g[i]=0;release[i]=step+(0 if driven[i] else refractory)
                if not blocked[i] and signs[i]!=0:
                    dest=(step+delay)%(delay+1)
                    for e in range(indptr[i],indptr[i+1]):
                        pending[dest,targets[e]]+=weights[e]*.275*signs[i]
    return bins,event_count

def main():
    p=argparse.ArgumentParser();p.add_argument('data',type=Path);p.add_argument('--benchmark',action='store_true');args=p.parse_args()
    root=args.data;out=Path(__file__).parent;meta=json.loads((root/'full-meta.json').read_text())
    arrays=np.load(root/'full-nodes.npz'); ids=arrays['ids'];base=arrays['signs'];W=load_npz(root/'full-graph.npz');groups={k:np.array(v,dtype=np.int32) for k,v in meta['groups'].items()}
    blocked=np.zeros(len(ids),np.bool_);blocked[groups['mAL']]=True;intact=np.zeros(len(ids),np.bool_)
    if args.benchmark:
        then=time.perf_counter();bins,events=simulate(W.indptr,W.indices,W.data,base,groups['candidate_male'],150.,intact,1,100.)
        print(json.dumps({'seconds':time.perf_counter()-then,'spikes':int(bins.sum()),'active_neurons':int(np.any(bins,axis=0).sum()),'events':events}),flush=True);return
    results=[];saved={};started=time.perf_counter()
    def trial(setting,pop,condition,seed,signs):
        begin=time.perf_counter();inp=groups.get(pop,np.array([],np.int32));rate=150. if pop=='PPN1' else (5550/len(inp) if len(inp) else 0.)
        bins,events=simulate(W.indptr,W.indices,W.data,signs,inp,rate,blocked if condition=='mAL_blocked' else intact,seed)
        key=f'{setting}__{pop}__{condition}__{seed}'
        # Store sparse events (10 ms bin, neuron index, count), losslessly.
        b,i=np.nonzero(bins);np.savez_compressed(root/(key+'.npz'),bin=b.astype(np.uint8),neuron=i.astype(np.int32),count=bins[b,i],ids=ids)
        rates={k:float(bins[5:,v].sum()/len(v)/.25) for k,v in groups.items()}
        result={'key':key,'setting':setting,'input':pop,'condition':condition,'seed':seed,'input_events':events,'rates_hz':rates,'spikes':int(bins.sum()),'active_neurons':int(np.any(bins,axis=0).sum()),'seconds':round(time.perf_counter()-begin,3)}
        results.append(result);print(json.dumps(result),flush=True)
        if seed==1:saved[key]=bins
        return bins
    for setting in ['conservative','female_input_excitatory']:
        signs=base.copy()
        if setting=='female_input_excitatory':signs[groups['candidate_female']]=1
        for pop in ['candidate_male','candidate_female']:
            for seed in [1,2,3]:
                for condition in ['intact','mAL_blocked']:trial(setting,pop,condition,seed,signs)
            restored=trial(setting,pop,'restored',1,signs)
            assert np.array_equal(restored,saved[f'{setting}__{pop}__intact__1'])
    quiet=trial('conservative','none','intact',1,base);assert not quiet.any()
    for condition in ['intact','mAL_blocked']:trial('conservative','PPN1',condition,1,base)
    comparisons=[]
    for setting in ['conservative','female_input_excitatory']:
        for pop in ['candidate_male','candidate_female']:
            pair=[r for r in results if r['setting']==setting and r['input']==pop]
            diffs=[]
            for seed in [1,2,3]:
                a=next(r for r in pair if r['seed']==seed and r['condition']=='intact');b=next(r for r in pair if r['seed']==seed and r['condition']=='mAL_blocked')
                assert a['input_events']==b['input_events']
                diffs.append(b['rates_hz']['P1_related']-a['rates_hz']['P1_related'])
            comparisons.append({'setting':setting,'input':pop,'paired_delta_hz':diffs,'mean_delta_hz':float(np.mean(diffs))})
    report={'metadata':meta,'protocol_sha256':hashlib.sha256((out/'PROTOCOL.md').read_bytes()).hexdigest(),'results':results,'comparisons':comparisons,'wall_seconds':time.perf_counter()-started,'checks':{'identical_paired_input_counts':True,'restoration_exact':True,'no_input_zero':True}}
    (out/'results.json').write_text(json.dumps(report,indent=2));print('COMPLETE',report['wall_seconds'],flush=True)

if __name__=='__main__':main()
