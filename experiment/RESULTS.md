# Full-connectome pilot results

**No mAL-dependent P1-related response was observed. This pilot does not demonstrate mate preference or reproduce the courtship result.**

The full classified MaleCNS v1.0 graph contains 166,606 neurons and 25,574,615 neuron-to-neuron connections, representing 124,144,950 anatomical synapse counts. All those edges are retained; 1,112,336 have zero modeled fast weight under the conservative transmitter assumptions. The model is a short, simplified LIF simulation, not a complete physiological fly.

All 24 primary/sensitivity trials had zero mAL and zero P1-related spikes. The seed-1 PPN1 control recruited 3,461 neurons but also produced zero mAL/P1-related spikes. Therefore the intended circuit mechanism was not functionally recruited in this model. This is a model/input/parameter limitation, not evidence against the biological study.

| Sign setting | Candidate input | Seed | Intact P1-related Hz | mAL blocked Hz | Intact active neurons | Blocked active neurons |
|---|---|---:|---:|---:|---:|---:|
| conservative | candidate_male | 1 | 0.000 | 0.000 | 503 | 503 |
| conservative | candidate_male | 2 | 0.000 | 0.000 | 457 | 457 |
| conservative | candidate_male | 3 | 0.000 | 0.000 | 493 | 493 |
| conservative | candidate_female | 1 | 0.000 | 0.000 | 27 | 27 |
| conservative | candidate_female | 2 | 0.000 | 0.000 | 27 | 27 |
| conservative | candidate_female | 3 | 0.000 | 0.000 | 27 | 27 |
| female_input_excitatory | candidate_male | 1 | 0.000 | 0.000 | 503 | 503 |
| female_input_excitatory | candidate_male | 2 | 0.000 | 0.000 | 457 | 457 |
| female_input_excitatory | candidate_male | 3 | 0.000 | 0.000 | 493 | 493 |
| female_input_excitatory | candidate_female | 1 | 0.000 | 0.000 | 126 | 126 |
| female_input_excitatory | candidate_female | 2 | 0.000 | 0.000 | 133 | 133 |
| female_input_excitatory | candidate_female | 3 | 0.000 | 0.000 | 129 | 129 |

Restoration reproduced intact activity exactly for all four seed-1 comparisons. No-input control remained silent. Each intervention pair received identical external events. Small-network checks verified excitation, inhibition, output block, and silence from rest. These are software checks, not biological validation.

31 full-network trials completed in 23.5 seconds after preparation/JIT compilation. Each trial was 300 ms of model time. Three seeds are technical replicates, not biological samples.

The viewer includes 139,659 actual soma positions. Other cells remain in the simulation and recordings but cannot be drawn at a soma location. Animation shows 10 ms spike-count bins over a 10-second loop (33.3× slower); color decay is a display effect, not modeled conduction. All trials are exported, with seed 1 selected by default before outcomes.

Interpretation: sparse recruitment and a silent intended readout mean this pilot cannot support a male/female comparison of courtship. Do not use downstream network recruitment as a preference proxy. Next scientific step would be auditing sensory-to-PPN1/mAL/pC1 paths, receptor signs, and the readout population; not choosing a gain or threshold to force mounting.

See [PROTOCOL.md](PROTOCOL.md) for fixed assumptions, sources and controls; [results.json](results.json) for exact values and provenance.
