import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createCircuit} from './circuit.js';
const data=JSON.parse(fs.readFileSync(new URL('./assets/circuit.json',import.meta.url)));
assert(data.edges.length>0);
const ids=new Map(data.nodes.map(n=>[n.id,n]));
for(const e of data.edges){assert(ids.has(e.source)&&ids.has(e.target));assert.equal(ids.get(e.source).nt,'gaba');assert.equal(ids.get(e.source).group,'mAL');assert.equal(ids.get(e.target).group,'P1');assert(e.weight>0&&Number.isInteger(e.weight));}
const a=createCircuit(data), b=createCircuit(data);
for(let k=0;k<60;k++){a.step({});b.step({});}
const assays=a.assay();
assert.deepEqual(a.step({}),b.step({}),'assay changes live states');
assert.equal(assays[0].maleP1,assays[2].maleP1,'restoration fails');
assert(assays[1].maleP1>assays[0].maleP1,'inhibitory reduction does not disinhibit');
assert.equal(assays[3].maleP1,0);assert.equal(assays[3].femaleP1,0);
assert.equal(assays[4].maleP1,0);assert.equal(assays[4].femaleP1,0);
fs.writeFileSync(new URL('./assays.json',import.meta.url),JSON.stringify({assays,validated:['real edge references and GABA consensus','restoration equality','output clamp zero','no target zero','assay does not mutate live simulation'],note:'Numerical software checks of selected schematic dynamics; not biological validation.'},null,2));
console.log(JSON.stringify({nodes:data.nodes.length,edges:data.edges.length,synapses:data.edges.reduce((s,e)=>s+e.weight,0),assays},null,2));
