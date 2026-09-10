// Reduced hypothesis model. Sensory encoding, time constants and motor decoding
// are declared assumptions; anatomical edge counts come from MaleCNS v1.0.
export function createCircuit(data) {
 const nodes=data.nodes, index=new Map(nodes.map((n,i)=>[n.id,i]));
 const mals=nodes.map((n,i)=>n.group==='mAL'?i:-1).filter(i=>i>=0);
 const p1s=nodes.map((n,i)=>n.group==='P1'?i:-1).filter(i=>i>=0);
 const edges=data.edges.filter(e=>index.has(e.source)&&index.has(e.target)).map(e=>({...e,s:index.get(e.source),t:index.get(e.target)}));
 const totalWeight=edges.reduce((s,e)=>s+e.weight,0);
 // Global normalization retains relative differences in incoming anatomical weights.
 const normalization=totalWeight/Math.max(1,p1s.length);
 const states={male:new Float64Array(nodes.length),female:new Float64Array(nodes.length)};
 let elapsed=0;
 function reset(){states.male.fill(0);states.female.fill(0);elapsed=0;}
 function channel(kind,cue,present,scale,clamp,dt){
  const a=states[kind], gate=present?Math.max(0,Math.min(1,cue)):0;
  const sensoryInhibition=kind==='male'?1:0.2;
  const excitatoryDrive=kind==='male'?0.75:1;
  const alpha=1-Math.exp(-Math.max(0,dt)/0.3);
  for(const i of mals) a[i]+=(gate*sensoryInhibition-a[i])*alpha;
  const inh=new Float64Array(nodes.length);
  for(const e of edges) inh[e.t]+=a[e.s]*e.weight*scale/normalization;
  for(const i of p1s){const desired=clamp?0:Math.max(0,Math.min(1,gate*excitatoryDrive-inh[i]));a[i]+=(desired-a[i])*alpha;if(clamp)a[i]=0;}
  const p1=p1s.reduce((s,i)=>s+a[i],0)/Math.max(1,p1s.length);
  const activities=Object.fromEntries(nodes.map((n,i)=>[n.id,a[i]]));
  return {p1,courtship:present&&p1>0.35,drive:Math.max(0,(p1-0.35)/0.65),activities,mAL:mals.reduce((s,i)=>s+a[i],0)/Math.max(1,mals.length)};
 }
 function step({dt=1/60,maleCue=1,femaleCue=1,mode='baseline',targetPresent=true,malePresent=targetPresent,femalePresent=targetPresent}={}){
  elapsed+=dt;const inhibitionScale=mode==='perturbed'?0.1:1,clamp=mode==='clamped';
  return {time:elapsed,inhibitionScale,male:channel('male',maleCue,malePresent,inhibitionScale,clamp,dt),female:channel('female',femaleCue,femalePresent,inhibitionScale,clamp,dt)};
 }
 function assay(){const test=createCircuit(data), result=[];for(const mode of ['baseline','perturbed','restored','clamped']){test.reset();let r;for(let k=0;k<600;k++)r=test.step({dt:1/60,mode});result.push({mode,maleP1:r.male.p1,femaleP1:r.female.p1,maleCourtship:r.male.courtship,femaleCourtship:r.female.courtship});}test.reset();let r;for(let k=0;k<600;k++)r=test.step({dt:1/60,mode:'perturbed',targetPresent:false});result.push({mode:'no-target',maleP1:r.male.p1,femaleP1:r.female.p1,maleCourtship:r.male.courtship,femaleCourtship:r.female.courtship});return result;}
 return {step,reset,assay,normalization};
}
