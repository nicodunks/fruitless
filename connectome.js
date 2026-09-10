import * as THREE from 'three';
// Recorded 10 ms spike bins. Local rings mark output block, not propagating spikes.
export function createConnectome(scene, raw, data){
 const points=[],lookup=new Int32Array(raw.length/3).fill(-1),mal=new Set(data.mAL),p1=new Set(data.P1);
 for(let i=0;i<lookup.length;i++)if(Number.isFinite(raw[i*3])){lookup[i]=points.length/3;points.push(raw[i*3],-raw[i*3+2],raw[i*3+1]);}
 const positions=new Float32Array(points),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.computeBoundingBox();
 const center=geometry.boundingBox.getCenter(new THREE.Vector3()),size=geometry.boundingBox.getSize(new THREE.Vector3()),scale=2.8/Math.max(size.x,size.y,size.z);
 for(let i=0;i<positions.length;i+=3){positions[i]=(positions[i]-center.x)*scale;positions[i+1]=(positions[i+1]-center.y)*scale;positions[i+2]=(positions[i+2]-center.z)*scale;}
 geometry.computeBoundingSphere();scene.add(new THREE.Points(geometry,new THREE.PointsMaterial({color:'#385356',size:.009,transparent:true,opacity:.28,depthWrite:false})));
 const sprite=document.createElement('canvas');sprite.width=sprite.height=64;const ctx=sprite.getContext('2d');
 ctx.strokeStyle='white';ctx.lineWidth=5;ctx.beginPath();ctx.arc(32,32,22,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(19,45);ctx.lineTo(45,19);ctx.stroke();
 const texture=new THREE.CanvasTexture(sprite);
 const glow=document.createElement('canvas');glow.width=glow.height=64;const gx=glow.getContext('2d'),gradient=gx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'white');gradient.addColorStop(.15,'white');gradient.addColorStop(.4,'rgba(255,255,255,.5)');gradient.addColorStop(1,'rgba(255,255,255,0)');gx.fillStyle=gradient;gx.fillRect(0,0,64,64);const glowTexture=new THREE.CanvasTexture(glow);
 function layer(size,map){const g=new THREE.BufferGeometry(),p=new Float32Array(positions.length),c=new Float32Array(positions.length);g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));g.setDrawRange(0,0);const mesh=new THREE.Points(g,new THREE.PointsMaterial({size,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,...(map?{map}: {})}));mesh.frustumCulled=false;scene.add(mesh);return {g,p,c};}
 const flashes=layer(.034),blocked=layer(.14,texture),p1Bursts=layer(.23,glowTexture),lime=new THREE.Color('#caff75'),violet=new THREE.Color('#bd9bff'),mint=new THREE.Color('#d9ffc1'),copper=new THREE.Color('#e7af7c');
 const trials={};for(const [mode,sexes] of Object.entries(data.trials)){trials[mode]={};for(const [sex,trial]of Object.entries(sexes)){const bins=Array.from({length:30},()=>[]);for(const e of trial.events)bins[e[0]].push(e);trials[mode][sex]=bins;}}
 return {update(seconds,mode,sex='male'){
  const t=seconds*3,bin=Math.min(29,Math.floor(t)),fraction=t-bin,active=new Map();
  for(let age=2;age>=0;age--){if(bin-age<0)continue;for(const [,id,count]of trials[mode][sex][bin-age]){if(lookup[id]<0)continue;active.set(id,Math.max(active.get(id)||0,(1-Math.exp(-count))*Math.exp(-(age+fraction)*1.5)));}}
  let n=0,b=0,q=0;for(const [id,strength]of active){const offset=lookup[id]*3,isBlocked=mode==='perturbed'&&mal.has(id),color=p1.has(id)?lime:isBlocked?violet:mal.has(id)?copper:mint;
   for(let k=0;k<3;k++){flashes.p[n+k]=positions[offset+k];flashes.c[n+k]=[color.r,color.g,color.b][k]*strength;}
   n+=3;
   if(p1.has(id)){for(let k=0;k<3;k++){p1Bursts.p[q+k]=positions[offset+k];p1Bursts.c[q+k]=[lime.r,lime.g,lime.b][k]*strength;}q+=3;}
   if(isBlocked){for(let k=0;k<3;k++){blocked.p[b+k]=positions[offset+k];blocked.c[b+k]=[violet.r,violet.g,violet.b][k]*strength;}b+=3;}
  }
  for(const [l,count]of [[flashes,n],[blocked,b],[p1Bursts,q]]){l.g.setDrawRange(0,count/3);l.g.attributes.position.needsUpdate=true;l.g.attributes.color.needsUpdate=true;}
 }};
}
