# Fruitless

A small, local Three.js courtship-circuit demo. No build step, hosting, API key, or backend.

```sh
npm install
npm start
```

Open http://127.0.0.1:8000. The scene automatically loops every 10 seconds. There is no timer or playback toolbar.

The default scene shows a male subject approaching a nearer male target while a female is also present. The right panel displays real MaleCNS anatomy and activity from the reduced circuit. **Model notes** contains controls and an evidence download.

## Full-connectome pilot

Open `/experiment.html` for synchronized playback of recorded full-network activity. The controlled pilot includes 166,606 classified MaleCNS neurons and 25.6 million connections. **It produced no mAL/P1-related response and does not demonstrate a preference switch.** See [experiment/RESULTS.md](experiment/RESULTS.md) and [reproduction instructions](experiment/README.md). The original fly scene below remains the earlier illustrative reduced model.

## What is real

124 selected MaleCNS v1.0 neurons (75 GABA-consensus mAL; 49 Fru+/Dsx+ pC1/P1-related), 1,106 measured connections representing 8,076 synapses, and actual anatomical coordinates. Inhibition is reduced to 10% with all cue inputs and thresholds fixed between conditions.

## What is modeled

The sensory input encoding, neural dynamics, threshold, and nearest-eligible-target decoder are explicit assumptions. Both targets remain eligible under reduced inhibition; the nearer male is selected. This is **not evidence of preference reversal**. Flight, wing motion, and the mounting pose are illustrative kinematics, not independently predicted biomechanics. The anatomical body asset derives from female micro-CT and is used illustratively for all flies.

The experiment is inspired by Kallman, Kim & Scott (2015), not a biological replication, a fruitless gene edit, or a reconstruction of their exact genetic driver line. See [MODEL.md](MODEL.md) and [assays.json](assays.json) for provenance and checks.

## Code

- `main.js`: scene, playback, 10-second loop, rate-coded light pulses, minimal model notes.
- `fly.js`: newly written loader and articulation for the anatomical assets.
- `circuit.js`: fixed-parameter rate model and isolated control assays.
- `index.html`: local entry point and model notes.

The meshes/rig are NeuroMechFly / NeLy-EPFL assets, Apache-2.0; notices remain in `assets/fly/`. MaleCNS data is CC-BY. Three.js is MIT. All assets and code needed at runtime are served locally.

Sources: https://male-cns.janelia.org/download/ · https://elifesciences.org/articles/11188 · https://github.com/NeLy-EPFL/fly-svg-maker
