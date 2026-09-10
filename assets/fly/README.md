# Anatomical fly assets

Downloaded 2026-09-10 from https://github.com/NeLy-EPFL/fly-svg-maker/tree/main/assets .
NeuroMechFly geometry and rigging originate from NeLy-EPFL/flygym, Apache-2.0; retain NOTICE and LICENSE-APACHE-2.0.txt.
The source morphology comes from a female micro-CT and is used as an illustrative body, not as a reconstruction of male anatomy.

`fly.js` is a newly authored Three.js loader/animator. It does not include the pose-editor application code.

```js
import {createFly, animateFly} from './fly.js';
const fly = await createFly('/fly-assets');
scene.add(fly);
// Per frame: time in seconds, airborne amount 0..1, left wing extension 0..1
animateFly(fly, time, 0, courtshipOutput);
```

The group uses Y up, faces +X, and has its left side toward -Z. Its feet sit at Y=0. Units are approximately millimetres. Neutral bounds are about 3.94 × 1.89 × 3.04 units. Move/rotate/scale the returned group freely. Segment joints are available through `fly.userData.fly.nodes`.

Loading verifies the neutral joint world positions against the independent reference supplied with the scientific assets. Observed maximum coordinate error: 4.86e-10. Wing/leg motion is illustrative kinematics, not physics or a biological experiment. Root motion is controlled entirely by the caller.

The anatomical asset is verified available and browser-loadable. It has **not** been established that this is the exact mesh used in the referenced viral video.
