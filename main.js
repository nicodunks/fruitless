import * as THREE from 'three';
import { createFly, animateFly } from './fly.js';
import { createCircuit } from './circuit.js';

const $ = id => document.getElementById(id);
const duration = 10, canvas = $('scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.autoClear = false;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#101317');
scene.fog = new THREE.Fog('#101317', 20, 55);
const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
camera.position.set(9, 10.5, 18); camera.lookAt(-.2, .6, 0);
scene.add(new THREE.HemisphereLight('#d5d9df', '#20232b', 1.1));
const key = new THREE.DirectionalLight('#fff1d1', 2.5);
key.position.set(-4, 12, 7); key.castShadow = true;
Object.assign(key.shadow.camera, {left:-13,right:13,top:12,bottom:-12,near:.1,far:40});
key.shadow.mapSize.set(2048,2048); key.shadow.normalBias=.025;
scene.add(key);
const rim = new THREE.DirectionalLight('#aabed8', 1.4); rim.position.set(3,5,-7); scene.add(rim);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(100,100), new THREE.MeshStandardMaterial({color:'#15191f',roughness:1}));
floor.rotation.x=-Math.PI/2; floor.position.y=-.03; floor.receiveShadow=true; scene.add(floor);
// A sparse ground grid gives the same quiet laboratory depth as the reference.
const grid = new THREE.GridHelper(80,80,'#59616e','#3c4450');
grid.material.transparent=true; grid.material.opacity=.48; grid.position.y=-.018; scene.add(grid);

const brainScene = new THREE.Scene(); brainScene.background=new THREE.Color('#091619');
const brainCamera = new THREE.PerspectiveCamera(35,1,.01,100);
brainCamera.position.set(0,0,4.3); brainCamera.lookAt(0,0,0);
const brain = new THREE.Group(); brainScene.add(brain);
const hudCanvas=document.createElement('canvas'), ctx=hudCanvas.getContext('2d');
const hudTexture = new THREE.CanvasTexture(hudCanvas); hudTexture.colorSpace=THREE.SRGBColorSpace;
const hudScene=new THREE.Scene(), hudCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,2);
hudCamera.position.z=1;
hudScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({map:hudTexture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false})));
let w=innerWidth,h=innerHeight,split=.77,viewW=1,clock=0,last=0,mode='perturbed';
let flies=[],model,data,context,trace=[],chosen=null,state=null,pointLayers=[],signalPaths=[],signalPoints,signalPositions;
const start=new THREE.Vector3(-5.8,0,-.3);
const targets=[{sex:'male',position:new THREE.Vector3(1.4,0,-2),color:'#c8dbab'}, {sex:'female',position:new THREE.Vector3(3.3,0,3.5),color:'#c8d2da'}];
const smooth=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x)};
function resize(width=innerWidth,height=innerHeight){
 w=width;h=height;split=w<700?.70:.77;viewW=Math.round(w*split);
 renderer.setSize(w,h,false);hudTexture.dispose();hudCanvas.width=w;hudCanvas.height=h;
 camera.aspect=viewW/h;camera.zoom=Math.min(1,camera.aspect/.75);camera.updateProjectionMatrix();
 brainCamera.aspect=(w-viewW)/h;brainCamera.updateProjectionMatrix();
 brainCamera.position.z=Math.max(5.6,2.15/(2*Math.tan(35*Math.PI/360)*brainCamera.aspect))*1.1;
 start.x=w<900?-3.1:-5.8;targets[1].position.x=w<900?1.8:3.3;
 targets.forEach((t,i)=>flies[i+1]?.position.copy(t.position));reset();
}
addEventListener('resize',()=>resize());resize();

function xyz(p){return new THREE.Vector3(p[0],-p[2],p[1]);}
function pointsGeometry(points,transform){return new THREE.BufferGeometry().setFromPoints(points.map(p=>transform(xyz(p))));}
function setupBrain(){
 const raw=Array.isArray(context)?context:(context.points||context.positions);
 const box=new THREE.Box3().setFromPoints(raw.map(xyz)),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 const scale=2.8/Math.max(size.x,size.y,size.z);
 const transform=v=>v.sub(center).multiplyScalar(scale);
 const cloud=new THREE.Points(pointsGeometry(raw,transform),new THREE.PointsMaterial({color:'#839fa0',size:.012,transparent:true,opacity:.46,sizeAttenuation:true,depthWrite:false}));
 brain.add(cloud);
 for(const node of data.nodes){
  const pts=node.points?.length?node.points:[node.position];
  if(!pts[0])continue;
  const material=new THREE.PointsMaterial({color:node.group==='mAL'?'#d99e70':'#c2eca2',size:.024,transparent:true,opacity:.7,depthWrite:false,blending:THREE.NormalBlending,toneMapped:false});
  const layer=new THREE.Points(pointsGeometry(pts,transform),material);brain.add(layer);pointLayers.push({node,material,phase:(node.id%97)/97,flash:0});
 }

 // Rate-coded light pulses along verified connections; paths are visual guides.
 const lookup=new Map(data.nodes.map(n=>[n.id,n]));
 signalPaths=[...data.edges].sort((a,b)=>b.weight-a.weight).slice(0,220).map((e,i)=>{
  const a=transform(xyz(lookup.get(e.source).position)),b=transform(xyz(lookup.get(e.target).position));
  const mid=a.clone().lerp(b,.5);mid.z+=.08;
  return {source:e.source,curve:new THREE.QuadraticBezierCurve3(a,mid,b),phase:(i*.6180339)%1};
 });
 signalPositions=new Float32Array(signalPaths.length*3);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(signalPositions,3));
 signalPoints=new THREE.Points(geometry,new THREE.PointsMaterial({color:'#fff1ba',size:.025,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));brain.add(signalPoints);
}
function reset(){clock=0;last=0;chosen=null;trace=[];model?.reset();if(flies[0])flies[0].position.copy(start);}
function update(dt){
 state=model.step({dt,maleCue:1,femaleCue:1,mode,targetPresent:true});
 if(clock>1&&!chosen){
  const eligible=targets.filter(t=>state[t.sex].courtship);
  chosen=eligible.sort((a,b)=>a.position.distanceTo(start)-b.position.distanceTo(start))[0]||null;
 }
 const subject=flies[0],t=clock*2.5;
 targets.forEach((target,i)=>{
  const fly=flies[i+1];
  const turns=i===0?[[1.4,.10],[4.6,-.08],[8.1,0]]:[[.8,-.11],[3.5,.07],[7.3,0]];
  let yaw=0,previous=0;
  for(const [at,angle] of turns){yaw+=(angle-previous)*smooth((clock-at)/.13);previous=angle;}
  fly.position.copy(target.position);fly.rotation.y=yaw;
  animateFly(fly,clock,0,0);
 });
 let airborne=0,wing=0;
 if(chosen){
  const partner=flies[targets.indexOf(chosen)+1];
  const goal=partner.position.clone().add(new THREE.Vector3(-.7,.67,0).applyAxisAngle(new THREE.Vector3(0,1,0),partner.rotation.y));
  const travel=smooth((clock-1)/5.8);
  subject.position.lerpVectors(start,goal,travel);
  subject.position.y+=Math.sin(Math.PI*travel)*1.45;
  airborne=smooth(travel/.08)*(1-smooth((travel-.88)/.12));
  subject.rotation.z=.12*smooth((travel-.65)/.35);
  const heading=Math.atan2(-(goal.z-start.z),goal.x-start.x);
  subject.rotation.y=THREE.MathUtils.lerp(heading,partner.rotation.y,smooth((travel-.55)/.45));
 }else{subject.position.copy(start);subject.rotation.set(0,0,0);}
 // A restrained thirteen-degree orbit and sixteen-percent dolly, all inside the loop.
 const push=smooth(clock/duration),angle=Math.atan2(9,18)-.23*push,radius=Math.hypot(9,18)*(1-.16*push);
 camera.position.set(Math.sin(angle)*radius,10.5-1.2*push,Math.cos(angle)*radius);
 camera.lookAt(-.2+.55*push,.6+.15*push,-.15*push);
 animateFly(subject,clock,airborne,wing);
 brain.rotation.y=.12*Math.sin(t*.16);brain.rotation.z=.04;
 const acts=state[chosen?.sex||'male'].activities;
 pointLayers.forEach(layer=>{
  const v=THREE.MathUtils.clamp(Number(acts?.[layer.node.id])||0,0,1);
  layer.phase+=dt*v*(2+(layer.node.id%7)*.3);
  if(layer.phase>=1){layer.phase%=1;layer.flash=1;}
  layer.flash*=Math.exp(-dt*9);
  layer.material.opacity=.08+.42*v+.5*layer.flash;
  layer.material.size=.006+.008*v+.01*layer.flash;
 });
 signalPaths.forEach((p,i)=>{
  const activity=Number(acts?.[p.source])||0;
  p.phase=(p.phase+dt*activity*.7)%1;
  const v=p.curve.getPoint(p.phase);if(activity<.01)v.set(100,100,100);
  v.toArray(signalPositions,i*3);
 });
 signalPoints.geometry.attributes.position.needsUpdate=true;
 if(trace.length===0||t-trace.at(-1).time>.1)trace.push({time:+t.toFixed(3),male:state.male.p1,female:state.female.p1,target:chosen?.sex||null,position:subject.position.toArray()});
}
function text(str,x,y,size=13,color='#c9d7d2',align='left',font='system-ui'){
 ctx.font=`${size}px ${font}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(str,x,y);
}
function project(pos){const p=pos.clone().project(camera);return {x:(p.x*.5+.5)*viewW,y:(-.5*p.y+.5)*h};}
function label(fly,str,color,offset=0){
 const p=project(fly.position.clone().add(new THREE.Vector3(0,1.3,0)));
 const y=p.y-52+offset,x=p.x;
 ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y+9);ctx.lineTo(x,p.y-5);ctx.moveTo(x-4,p.y-10);ctx.lineTo(x,p.y-5);ctx.lineTo(x+4,p.y-10);ctx.stroke();
 text(str,x,y,Math.max(13,w/90),color,'center');
}
function drawHud(){
 ctx.clearRect(0,0,w,h);
 const pad=w<700?18:34,small=w<700?10:12;
 ctx.strokeStyle='#45605c55';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(viewW,0);ctx.lineTo(viewW,h);ctx.stroke();
 text('FRUITLESS',pad,40,14,'#e3e9df','left','monospace');
 text('A COURTSHIP CIRCUIT',pad,61,small,'#8fa6a1','left','monospace');
 text('CONNECTOME',viewW+pad*.65,40,small,'#d3e1d9','left','monospace');
 text('Modeled activity',viewW+pad*.65,62,small,'#829c99');
 if(flies.length){
  label(flies[1],'Male',targets[0].color,-7);label(flies[2],'Female',targets[1].color,0);
  if(clock<3.2)label(flies[0],'Male · subject','#e4e9db',-5);
 }
 const status=!chosen?'Observing':clock<6.8?'Approaching male':'Courtship';
 const actual=chosen?.sex==='female'?status.replace('male','female'):status;
 canvas.setAttribute('aria-label',`${actual}. ${mode} condition. Target: ${chosen?.sex||'none'}. Male response ${state?.male.p1.toFixed(3)||'0'}, female response ${state?.female.p1.toFixed(3)||'0'}.`);

 const rx=viewW+pad*.65,rwidth=w-viewW-pad*1.3;
 ctx.fillStyle='#c6dbab';ctx.fillRect(rx,h-134,5,5);text('P1-related',rx+13,h-128,small,'#b4c7b2');
 ctx.fillStyle='#d9ac85';ctx.fillRect(rx,h-108,5,5);text('mAL',rx+13,h-102,small,'#b4c7b2');
 const value=state?state.male.p1:0;
 ctx.fillStyle='#304341';ctx.fillRect(rx,h-80,rwidth,2);ctx.fillStyle='#c6dbab';ctx.fillRect(rx,h-80,rwidth*THREE.MathUtils.clamp(value,0,1),2);
 text(`${data?.nodes.length||0} modeled neurons`,rx,h-49,w<700?9:11,'#6f8e88');

 hudTexture.needsUpdate=true;
}
function render(){
 renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);renderer.clear();
 renderer.setScissorTest(true);renderer.setViewport(0,0,viewW,h);renderer.setScissor(0,0,viewW,h);renderer.clear();renderer.render(scene,camera);
 renderer.setViewport(viewW,0,w-viewW,h);renderer.setScissor(viewW,0,w-viewW,h);renderer.clear();renderer.render(brainScene,brainCamera);
 renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);renderer.clearDepth();renderer.render(hudScene,hudCamera);
}
function frame(now){
 const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;
 clock+=dt;if(clock>=duration)reset();update(dt);
 drawHud();render();
 requestAnimationFrame(frame);
}
function saveBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
$('details').onclick=()=>{$('notes').showModal()};$('close').onclick=()=>$('notes').close();
document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{mode=button.dataset.mode;reset();$('notes').close();});
$('download').onclick=()=>saveBlob(new Blob([JSON.stringify({mode,assays:model.assay(),trajectory:trace,circuit:data},null,2)],{type:'application/json'}),'fruitless-evidence.json');
try{
 [flies,data,context]=await Promise.all([Promise.all([createFly('./assets/fly'),createFly('./assets/fly'),createFly('./assets/fly')]),fetch('./assets/circuit.json').then(r=>{if(!r.ok)throw Error('Circuit data unavailable');return r.json()}),fetch('./assets/context.json').then(r=>r.json())]);
 flies.forEach((fly,i)=>{fly.scale.setScalar(i===2?.59:.55);scene.add(fly);if(i)fly.position.copy(targets[i-1].position)});
 model=createCircuit(data);setupBrain();reset();update(1/60);
 $('model-notes').innerHTML=`<p>${data.nodes.length} neurons and ${data.edges.length} measured connections from MaleCNS v1.0. The intervention reduces modeled inhibition from GABA-consensus mAL neurons onto Fru+/Dsx+ pC1 (P1-related) neurons. This is a hypothesis model inspired by Kallman, Kim & Scott (2015), not a replication of a fruitless mutation or the paper’s exact genetic driver line.</p><p>Synapse counts and anatomical coordinates are data. Neural rates, cue encoding, thresholds, and movement are assumptions. Male/female excitation is fixed at 0.75/1; inhibitory input at 1/0.2. Reduced inhibition scales outgoing inhibition to 10%. Courtship threshold: 0.35. These settings are shared across conditions.</p><p>The dim point cloud shows real CNS soma positions. Only the colored selected circuit carries modeled activity. Traveling pulses and flashes encode model rates; they are illustrative signals, not simulated action potentials or measured conduction paths.</p>`;
 $('assay').textContent='Model response       Male    Female\n'+model.assay().map(r=>`${r.mode.padEnd(20)} ${r.maleP1.toFixed(3)}   ${r.femaleP1.toFixed(3)}`).join('\n');
 $('loading').remove();
 requestAnimationFrame(frame);
}catch(error){$('loading').textContent=`Demo couldn't load: ${error.message}`;console.error(error);}
