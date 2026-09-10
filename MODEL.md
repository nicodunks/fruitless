# Reduced MaleCNS courtship circuit

`circuit.json` contains actual MaleCNS v1.0 body IDs, soma locations, sampled SWC geometry, and direct mAL-to-pC1 synapse-count connections. `context.json` contains real subsampled CNS soma positions for dim anatomical context only. Coordinates use 8nm voxels, not millimetres.

The selected source cohort is male-specific `mAL_m*` neurons with `consensus_nt == gaba`. The selected target cohort is `pC1_*` neurons with `fruDsx == coexpress_high`. This is a conservative annotated Fru+/Dsx+ P1-related cohort; it is not a reconstruction of the exact genetic driver population in a particular experiment. Other mAL neurons, including unclear and glutamatergic classes, are excluded. Only participating bodies survive extraction.

The sign of each selected edge is a supported **model assumption** using GABA annotation and the experimentally demonstrated inhibitory mAL-to-P1 relationship. The dataset directly supplies anatomical connections and counts; it does not measure effective physiological signs, strengths or response time constants.

`circuit.js` uses these counts, normalized by mean selected incoming total, in a small feedforward rate model. Fixed assumed sensory drive is .75 for male cues, 1 for female cues; inhibition drive is 1 and .2 respectively. No-target drive is zero. Rate time constant is .3 seconds; motor eligibility threshold is .35. Perturbation changes only mAL output gain from 1 to .1. These values are schematic and chosen for demonstration, not measured physiology or a fitted reproduction. Global edge normalization preserves relative differences between postsynaptic bodies.

Each candidate target is evaluated in a separate simplified response channel. This is an illustrative per-target cue-response policy, not a claim that a fly runs two separate brains. A consumer may select the nearest eligible target with the same policy across baseline and intervention. When male and female both become eligible after disinhibition, approach of a nearer male supports increased male-directed modeled courtship; it does not establish preference reversal. Counterbalance distances to expose that dependency.

Animation of gait and wing mechanics may be procedural. Only selection of courtship/pursuit should depend on the neural output. A P1-output-clamped control should eliminate that behavior while target movement continues.

`verify.mjs` checks restoration, clamping, no-target response, edge references and assay isolation. These are software and model-dependency checks, not biological validation.

Source dataset: https://male-cns.janelia.org/download/ (CC BY 4.0; FlyEM/HHMI Janelia, University of Cambridge/MRC LMB, Google Research).
Mechanism reference: Kallman et al., https://elifesciences.org/articles/11188 .
