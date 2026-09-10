import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

// Anatomical assets: NeuroMechFly / NeLy-EPFL, Apache-2.0 (see NOTICE).
// This scene helper is independently authored. Animation is illustrative kinematics.
const cache = new Map();
const rad = Math.PI / 180;
const turn = new THREE.Quaternion();

async function loadAssets(base) {
  if (!cache.has(base)) cache.set(base, (async () => {
    const response = await fetch(`${base}/model.json`);
    if (!response.ok) throw new Error(`Fly model: HTTP ${response.status}`);
    const model = await response.json();
    const loader = new STLLoader();
    const files = [...new Set(Object.values(model.meshes).map(x => x.file))];
    const geometries = Object.fromEntries(await Promise.all(files.map(async file => {
      const geometry = await loader.loadAsync(`${base}/meshes/${file}`);
      geometry.scale(model.meshScale, model.meshScale, model.meshScale);
      geometry.computeVertexNormals();
      return [file, geometry];
    })));
    return { model, geometries };
  })());
  return cache.get(base);
}

function pose(state, changes = {}) {
  for (const [name, node] of Object.entries(state.nodes)) {
    node.quaternion.copy(state.rest[name]);
    for (const dof of state.dofs[name] || []) {
      const degrees = (state.model.neutralDeg[dof.name] || 0) + (changes[dof.name] || 0);
      node.quaternion.multiply(turn.setFromAxisAngle(dof.vector, degrees * rad));
    }
  }
}

/** Y-up, head points +X, left side points -Z. Units approximately millimetres.
 * Feet rest at Y=0. Root position/rotation/scale remain under caller control.
 * Repeated instances share immutable geometry, but have independent joints/materials.
 */
export async function createFly(assetBase) {
  const { model, geometries } = await loadAssets(assetBase.replace(/\/$/, ''));
  const group = new THREE.Group();
  group.name = 'NeuroMechFly';
  const body = new THREE.Group();
  const state = { model, nodes: {}, rest: {}, dofs: {}, body };
  for (const name of model.segments) {
    const node = new THREE.Group();
    node.name = name;
    const conf = model.rest[name];
    node.position.fromArray(conf.pos);
    const [w, x, y, z] = conf.quat;
    state.rest[name] = new THREE.Quaternion(x, y, z, w).normalize();
    const wing = name.endsWith('_wing');
    const material = new THREE.MeshStandardMaterial({
      color: wing ? new THREE.Color('#9daea2') : name.includes('eye') ? new THREE.Color('#683c33') : name.includes('abdomen6') ? new THREE.Color('#29332b') : new THREE.Color('#414a42'),
      roughness: wing ? 0.35 : 0.52,
      metalness: wing ? 0.08 : 0,
      transparent: wing,
      opacity: wing ? 0.34 : 1,
      depthWrite: !wing,
      side: wing ? THREE.DoubleSide : THREE.FrontSide,
    });
    const spec = model.meshes[name];
    const mesh = new THREE.Mesh(geometries[spec.file], material);
    mesh.name = `${name}_mesh`;
    if (spec.mirror) mesh.scale.y = -1;
    mesh.castShadow = !wing;
    mesh.receiveShadow = !wing;
    node.add(mesh);
    state.nodes[name] = node;
  }
  for (const d of model.dofs) {
    (state.dofs[d.child] ||= []).push({ ...d,
      vector: new THREE.Vector3().fromArray(Array.isArray(d.axis) ? d.axis : model.axisVector[d.axis]),
    });
  }
  body.add(state.nodes[model.root]);
  for (const [parent, child] of model.joints) state.nodes[parent].add(state.nodes[child]);
  pose(state);
  body.updateMatrixWorld(true);
  let error = 0;
  const point = new THREE.Vector3();
  for (const [name, xyz] of Object.entries(model.reference.neutralJointPositions)) {
    state.nodes[name].getWorldPosition(point);
    error = Math.max(error, ...point.toArray().map((v, i) => Math.abs(v - xyz[i])));
  }
  if (error > 1e-5) throw new Error(`Fly neutral pose mismatch: ${error}`);
  group.userData.neutralPoseMaxError = error;
  body.rotation.x = -Math.PI / 2;
  group.add(body);
  group.updateMatrixWorld(true);
  body.position.y = -new THREE.Box3().setFromObject(body).min.y;
  group.userData.fly = state;
  return group;
}

/** flight: 0 resting, 1 airborne. wingExtension: 0..1 left courtship wing.
 * Illustrative wing/leg motion, not a biomechanical simulation or scientific output.
 * Caller alone controls travel; this helper never moves the returned root.
 */
export function animateFly(group, time, flight = 0, wingExtension = 0) {
  const state = group.userData.fly;
  if (!state) return;
  const airborne = THREE.MathUtils.clamp(Number(flight), 0, 1);
  const court = THREE.MathUtils.clamp(wingExtension, 0, 1);
  const changes = {};
  for (const side of ['l', 'r']) {
    const sign = side === 'l' ? 1 : -1;
    const ext = side === 'l' ? court : 0;
    changes[`c_thorax-${side}_wing-roll`] = sign * (airborne * 70 + ext * 65);
    changes[`c_thorax-${side}_wing-yaw`] = sign * (airborne * 24 * Math.sin(time * 85) + ext * 8 * Math.sin(time * 65));
    for (const leg of ['f', 'm', 'h']) {
      changes[`${side}${leg}_coxa-${side}${leg}_trochanterfemur-pitch`] = airborne * -20;
      changes[`${side}${leg}_trochanterfemur-${side}${leg}_tibia-pitch`] = airborne * 25;
    }
  }
  pose(state, changes);
}
