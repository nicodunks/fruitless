import * as THREE from 'three';
const $=id=>document.getElementById(id),canvas=$('network');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.autoClear=false;
const scene=new THREE.Scene();scene.background=new THREE.Color('#091619');
const camera=new THREE.PerspectiveCamera(32,1,.01,100),group=new THREE.Group();scene.add(group);
const dim=new THREE.Color('#385356'),lit=new THREE.Color('#d9ffc1');
let reports,recordings,keys=[],start=performance.now(),lastBin=-1,positions,colors,indexMap,geometry,counts,hasSoma,flashGeometry,flashPositions,flashColors;
const load=async(path,type='json')=>{const r=await fetch(path);if(!r.ok)throw Error(`${path}: ${r.status}`);return r[type]();};
function choose(){
 const control=['PPN1','none'].includes($('input').value);
 $('setting').disabled=$('seed').disabled=control;
 if(control){$('setting').value='conservative';$('seed').value='1';}
 const prefix=`${$('setting').value}__${$('input').value}__`;
 keys=['intact','mAL_blocked'].map(c=>`${prefix}${c}__${$('seed').value}`);
 // No-input was run once; do not pretend a second unrun intervention trial exists.
 if($('input').value==='none')keys[1]=keys[0];
 document.querySelector('.labels>div:nth-child(2)>b').textContent=$('input').value==='none'?'Same no-input control':'mAL output blocked';
 counts=keys.map(key=>{
  const perBin=Array.from({length:30},()=>[]);
  for(const [bin,neuron,count] of recordings[key])perBin[bin].push([neuron,count]);
  return perBin;
 });
 keys.forEach((key,i)=>{const r=reports.results.find(r=>r.key===key);$(i?'right':'left').textContent=`P1-related ${r.rates_hz.P1_related.toFixed(1)} Hz · ${r.active_neurons.toLocaleString()} active neurons`;});
 const r=reports.results.find(r=>r.key===keys[0]);
 const visible=new Set(recordings[keys[0]].filter(e=>hasSoma[e[1]]).map(e=>e[1]));
 $('coverage').textContent=`139,659 of 166,606 cells have soma positions for display. This intact trial recruited ${r.active_neurons.toLocaleString()} cells; ${visible.size.toLocaleString()} have visible soma positions. All cells are retained in the simulation and recordings.`;
 start=performance.now();lastBin=-1;
}
function paint(which,time){
 const bin=Math.min(29,Math.floor(time/10)),fraction=time/10-bin,flashes=new Map();
 // Fixed afterglow visualizes recorded bins; it is not a traveling electrical simulation.
 for(let age=2;age>=0;age--){
  const b=bin-age;if(b<0)continue;
  for(const [neuron,count] of counts[which][b]){
   const vertex=indexMap[neuron];if(vertex<0)continue;
   const strength=(1-Math.exp(-count))*Math.exp(-(age+fraction)*1.5);
   flashes.set(vertex,Math.max(flashes.get(vertex)||0,strength));
  }
 }
 let j=0;
 for(const [vertex,strength] of flashes){
  flashPositions[j]=positions[vertex*3];flashPositions[j+1]=positions[vertex*3+1];flashPositions[j+2]=positions[vertex*3+2];
  flashColors[j]=lit.r*strength;flashColors[j+1]=lit.g*strength;flashColors[j+2]=lit.b*strength;j+=3;
 }
 flashGeometry.setDrawRange(0,j/3);flashGeometry.attributes.position.needsUpdate=true;flashGeometry.attributes.color.needsUpdate=true;
}
function frame(now){
 requestAnimationFrame(frame);if(!counts)return;
 const time=((now-start)%10000)/10000*300;
 const width=canvas.clientWidth,height=canvas.clientHeight,half=Math.floor(width/2);
 renderer.setSize(width,height,false);camera.aspect=half/height;
 camera.position.set(0,0,Math.max(5.5,3.1/(2*Math.tan(16*Math.PI/180)*camera.aspect)));camera.lookAt(0,0,0);camera.updateProjectionMatrix();
 group.rotation.y=matchMedia('(prefers-reduced-motion: reduce)').matches?0:.12*Math.sin((now-start)/10000*Math.PI*2);
 renderer.setScissorTest(false);renderer.setViewport(0,0,width,height);renderer.clear();renderer.setScissorTest(true);
 for(let side=0;side<2;side++){paint(side,time);renderer.setViewport(side*half,0,half,height);renderer.setScissor(side*half,0,half,height);renderer.render(scene,camera);}
 $('phase').textContent=time<50?'BASELINE · no input':time<250?'STIMULUS · matched external drive':'WASHOUT · input off';
}
try{
 const [report,events,buffer]=await Promise.all([load('experiment/results.json'),load('experiment/recordings.json'),load('experiment/positions.f32','arrayBuffer')]);
 reports=report;recordings=events;const raw=new Float32Array(buffer),vertices=[];indexMap=new Int32Array(raw.length/3).fill(-1);hasSoma=new Uint8Array(indexMap.length);
 for(let i=0;i<indexMap.length;i++)if(Number.isFinite(raw[i*3])){indexMap[i]=vertices.length/3;hasSoma[i]=1;vertices.push(raw[i*3],-raw[i*3+2],raw[i*3+1]);}
 positions=new Float32Array(vertices);geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.computeBoundingBox();
 const center=geometry.boundingBox.getCenter(new THREE.Vector3()),size=geometry.boundingBox.getSize(new THREE.Vector3()),scale=2.8/Math.max(size.x,size.y,size.z);
 for(let j=0;j<positions.length;j+=3){positions[j]=(positions[j]-center.x)*scale;positions[j+1]=(positions[j+1]-center.y)*scale;positions[j+2]=(positions[j+2]-center.z)*scale;}
 geometry.computeBoundingSphere();colors=new Float32Array(positions.length);for(let j=0;j<colors.length;j+=3){colors[j]=dim.r;colors[j+1]=dim.g;colors[j+2]=dim.b;}geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
 group.add(new THREE.Points(geometry,new THREE.PointsMaterial({size:.009,vertexColors:true,transparent:true,opacity:.28,depthWrite:false,blending:THREE.NormalBlending,toneMapped:false})));
 flashGeometry=new THREE.BufferGeometry();flashPositions=new Float32Array(positions.length);flashColors=new Float32Array(positions.length);flashGeometry.setAttribute('position',new THREE.BufferAttribute(flashPositions,3));flashGeometry.setAttribute('color',new THREE.BufferAttribute(flashColors,3));flashGeometry.setDrawRange(0,0);
 const flashes=new THREE.Points(flashGeometry,new THREE.PointsMaterial({size:.036,vertexColors:true,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));flashes.frustumCulled=false;group.add(flashes);
 for(const id of ['input','setting','seed'])$(id).addEventListener('change',choose);
 choose();requestAnimationFrame(frame);
}catch(error){$('error').textContent=`Could not load experiment: ${error.message}`;console.error(error);}
