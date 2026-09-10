import * as THREE from 'three';
import { createFly, animateFly } from './fly.js';
import { createConnectome } from './connectome.js';

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
let w=innerWidth,h=innerHeight,split=.70,brainH=1,viewW=1,clock=0,last=0,mode='perturbed';
let flies=[],data,connectome,trace=[],chosen=null,state=null;
const start=new THREE.Vector3(-5.8,0,-.3);
const targets=[{sex:'male',position:new THREE.Vector3(1.4,0,-2),color:'#77b6ff'}, {sex:'female',position:new THREE.Vector3(3.3,0,3.5),color:'#f598c1'}];
const smooth=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x)};
function resize(width=innerWidth,height=innerHeight){
 w=width;h=height;split=w<700?.66:.70;viewW=Math.round(w*split);brainH=Math.round(h*.64);
 renderer.setSize(w,h,false);hudTexture.dispose();hudCanvas.width=w;hudCanvas.height=h;
 camera.aspect=viewW/h;camera.zoom=Math.min(1,camera.aspect/.75);camera.updateProjectionMatrix();
 brainCamera.aspect=(w-viewW)/brainH;brainCamera.updateProjectionMatrix();
 brainCamera.position.z=Math.max(5.6,2.15/(2*Math.tan(35*Math.PI/360)*brainCamera.aspect))*1.1;
 start.x=w<900?-3.1:-5.8;targets[1].position.x=w<900?1.8:3.3;
 targets.forEach((t,i)=>flies[i+1]?.position.copy(t.position));reset();
}
addEventListener('resize',()=>resize());resize();

function reset(){clock=0;last=0;chosen=null;trace=[];if(flies[0])flies[0].position.copy(start);}
function update(dt){
 state=data.trials[mode];
 if(clock>1&&!chosen){
  const eligible=targets.filter(t=>state[t.sex].spikes>0);
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
 // A thirty-six-degree orbit with a quicker start and a smooth finish.
 const progress=clock/duration,push=smooth(progress),orbit=1-Math.pow(1-progress,2),angle=Math.atan2(9,18)-.63*orbit,radius=Math.hypot(9,18)*(1-.16*push);
 camera.position.set(Math.sin(angle)*radius,10.5-1.2*push,Math.cos(angle)*radius);
 camera.lookAt(-.2+.55*push,.6+.15*push,-.15*push);
 animateFly(subject,clock,airborne,wing);
 brain.rotation.y=.12*Math.sin(t*.16);brain.rotation.z=.04;
 connectome.update(clock,mode);
 if(trace.length===0||clock-trace.at(-1).time>.1)trace.push({time:+clock.toFixed(3),male:state.male.spikes,female:state.female.spikes,target:chosen?.sex||null,position:subject.position.toArray()});
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
 text(mode==='perturbed'?'mAL OUTPUT BLOCKED':'mAL OUTPUT INTACT',viewW+pad*.65,62,w<700?9:11,mode==='perturbed'?'#bd9bff':'#e7af7c','left','monospace');
 if(flies.length){
  label(flies[1],'Male',targets[0].color,-7);label(flies[2],'Female',targets[1].color,0);
  label(flies[0],'Male · subject',targets[0].color,-5);
 }
 const status=!chosen?'Observing':clock<6.8?'Approaching male':'Courtship';
 const actual=chosen?.sex==='female'?status.replace('male','female'):status;
 canvas.setAttribute('aria-label',`${actual}. ${mode} condition. Target: ${chosen?.sex||'none'}. Male response ${state?.male.spikes||'0'}, female response ${state?.female.spikes||'0'}.`);

 const rx=viewW+pad*.65,rwidth=w-viewW-pad*1.3;
 ctx.fillStyle='#caff75';ctx.fillRect(rx,brainH-134,5,5);text('P1 spikes',rx+13,brainH-128,small,'#caff75');
 ctx.fillStyle='#d9ffc1';ctx.fillRect(rx,brainH-108,5,5);text('Recorded spikes',rx+13,brainH-102,small,'#b4c7b2');
 ctx.fillStyle=mode==='perturbed'?'#bd9bff':'#e7af7c';ctx.fillRect(rx,brainH-82,5,5);text(mode==='perturbed'?'mAL · output blocked':'mAL · intact',rx+13,brainH-76,small,mode==='perturbed'?'#bd9bff':'#e7af7c');
 text('166,606 neurons',rx,brainH-49,w<700?9:11,'#6f8e88');

 hudTexture.needsUpdate=true;
}
function render(){
 renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);renderer.clear();
 renderer.setScissorTest(true);renderer.setViewport(0,0,viewW,h);renderer.setScissor(0,0,viewW,h);renderer.clear();renderer.render(scene,camera);
 renderer.setViewport(viewW,h-brainH,w-viewW,brainH);renderer.setScissor(viewW,h-brainH,w-viewW,brainH);renderer.clear();renderer.render(brainScene,brainCamera);
 renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);renderer.clearDepth();renderer.render(hudScene,hudCamera);
}
function frame(now){
 const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;
 clock+=dt;if(clock>=duration)reset();update(dt);
 drawHud();render();
 requestAnimationFrame(frame);
}
try{
 let raw;
 [flies,data,raw]=await Promise.all([Promise.all([createFly('./assets/fly'),createFly('./assets/fly'),createFly('./assets/fly')]),fetch('./assets/playback.json').then(r=>{if(!r.ok)throw Error('Recording unavailable');return r.json()}),fetch('./experiment/positions.f32').then(r=>{if(!r.ok)throw Error('Anatomy unavailable');return r.arrayBuffer()})]);
 flies.forEach((fly,i)=>{fly.scale.setScalar(i===2?.59:.55);scene.add(fly);if(i)fly.position.copy(targets[i-1].position)});
 connectome=createConnectome(brain,new Float32Array(raw),data);reset();update(1/60);
 $('loading').remove();
 requestAnimationFrame(frame);
}catch(error){$('loading').textContent=`Demo couldn't load: ${error.message}`;console.error(error);}
