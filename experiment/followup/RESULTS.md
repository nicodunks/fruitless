# Follow-up: a repeatable modeled response change

**Blocking mAL output enabled a small P1-related response to candidate male sensory input.** This survived three fresh random seeds and two bounded-inhibition settings in the full 166,606-neuron network. It is conditional model evidence for disinhibition—not a demonstrated male preference, natural courtship, or biological replication.

## Primary confirmation

The same full graph, signs, external input events, initial state and parameters were used within each intact/blocked pair. Both male and female input populations were evaluated using the same network/sign assumptions. The only intervention was blocking outgoing transmission from 75 GABA-annotated mAL cells. There was **no tonic drive or forced spike injection into the P1 readout** in these sensory runs.

Counts below are total spikes across the prespecified eight-cell readout during the 250 ms response window (200 ms stimulation plus 50 ms washout). Each triplet lists seeds 11, 12 and 13; these are technical replicates, not biological animals.

| Inhibitory reversal assumption | Input | Intact spike counts | mAL output blocked |
|---|---|---|---|
| −70 mV | Candidate male sensory cells | 0, 0, 0 | **4, 5, 1** |
| −80 mV | Candidate male sensory cells | 0, 0, 0 | **4, 7, 1** |
| −70 mV | Candidate female sensory cells | 11, 8, 8 | 18, 18, 20 |
| −80 mV | Candidate female sensory cells | 10, 10, 9 | 21, 23, 22 |
| −70 mV | Direct vAB3 relay stimulation | 0, 0, 0 | 13, 9, 12 |
| −80 mV | Direct vAB3 relay stimulation | 0, 0, 0 | 10, 15, 12 |

The male-candidate response increased in every tested seed under both assumptions, but remained weaker than the female-candidate response. There are three fresh seeds evaluated under two model settings, not six independent seeds. A single spike or any chosen activity threshold cannot establish mate preference. No movement/choice decoder was added.

## What changed from the failed pilot

1. **Readout mapping:** an official v0.9→v1.0 body-ID join identified eight cells named P1_4a/b in a published R71G01 mapping, now pC1_4a/b. The initial coexpression filter excluded them. Both this subset and the original 49-cell readout were retained in the diagnostics. Physiological correspondence is not settled: expected direct vAB3 wiring is weak in the eight-cell subset, a discrepancy documented in [MAPPING.md](MAPPING.md). We therefore call it a literature-mapped candidate P1 readout, not an exact reconstruction of a genetic driver.
2. **Relay sign:** the pilot treated all glutamate output as inhibitory, including vAB3. Functional experiments instead support an excitatory vAB3 courtship pathway. We tested an explicit excitatory override for AN09B017e/f; candidate female-input output was also assumed excitatory to address glutamate/unclear annotations. Both overrides are present in every final bounded sensory run. These are broad sign assumptions, not measured receptor-specific signs for every connection.
3. **Reception and voltage:** independently instrumenting the original model showed subthreshold signals even when there were no spikes. It also exposed extremely negative voltages in the unbounded current model. The final confirmation uses inhibitory conductance with a finite reversal, calibrated to the original current effect at rest. All voltage-bound assertions passed.

The original failed sign settings and negative trials are retained. The positive result was not obtained by imposing a behavioral threshold, selecting a lucky seed, injecting spikes into P1, or modifying anatomical weights.

## Independent mechanism checks

A separate artificial assay continuously depolarized the eight-cell group while activating mAL. This deliberately bypasses sensory identity and only tests the brake mechanism. In the bounded model, mean firing was 32.75 or 33.75 Hz per cell, fell to zero with mAL activation, and returned to those rates when mAL output was blocked. Blocking only the direct mAL→readout edges also restored activity, often above the tonic-only level because indirect network effects remained. All five seeds per reversal setting agreed. No-input and mAL-only controls did not activate the readout.

The original current-based brake assay also showed suppression and recovery across three predefined drives and ten additional seeds at the primary drive, but its extreme voltages limit physiological interpretation. Re-running a restored configuration establishes reproducibility; it is not evidence of recovery over time within a single trial.

Independent numerical checks against Brian2 verified the linear integration formula and refractory-arrival behavior. They do not establish complete scheduling equivalence or biological validation. Hashes verify matched inputs, the final code/protocol versions and raw recorded spike totals.

## Scope and limitations

The full classified graph contains 166,606 neurons and 25,574,615 connections. Unknown/modulatory transmitter effects, receptor-specific signs, sensory encoding, background brain state, neuromodulation and biomechanics remain simplified or absent. Synapse counts are anatomical measurements, not calibrated physiological conductances. The reversal values and homogeneous neuron constants are model assumptions. Only a short response window and a small number of technical seeds were tested.

The justified statement is: **“In a full-connectome model with specified transmitter assumptions, blocking mAL output enabled a previously suppressed response to candidate male sensory stimulation.”** It does not justify “the fly chose males over females” or “we reproduced sexual preference.”

The viewer and fly animation were left unchanged. These follow-up recordings are saved separately for a later representative visualization.

## Evidence

- [Exact final comparisons and checks](summary.json)
- [All 36 bounded sensory outcomes](bounded-route-results.json) and [protocol](BOUNDED_ROUTE_PROTOCOL.md)
- [Full bounded sensory spike recordings](bounded-route-recordings.npz)
- [Exploratory outcomes](route-discovery.json), [fresh-seed outcomes](route-holdout.json), and [all exploratory spike recordings](exploratory-route-recordings.npz)
- [Subthreshold reception](reception.json)
- [Current-based brake results](brake-results.json), [bounded brake results](bounded-brake-results.json), and [controls](bounded-brake-controls.json)
- [Independent audit code, original protocols and reports](audit-source.zip)

Primary sources: [MaleCNS data](https://male-cns.janelia.org/download/), [Ryba et al. 2026](https://doi.org/10.1016/j.cub.2026.01.071), [Clowney et al. 2015](https://pubmed.ncbi.nlm.nih.gov/26279475/), [Kallman, Kim & Scott 2015](https://elifesciences.org/articles/11188), and [Shiu reference model](https://github.com/philshiu/Drosophila_brain_model).
