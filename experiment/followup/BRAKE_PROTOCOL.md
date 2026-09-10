# Prespecified direct inhibitory-brake experiment

This is a controlled artificial coactivation assay on the full 166,606-neuron graph, NOT a sex preference or natural sensory experiment. It follows a static anatomy audit and does not replace the initial negative pilot.

Primary target: eight cells identified as R71G01 P1_4a/b in Ryba et al. 2026 (DOI10.1016/j.cub.2026.01.071), matched by body ID from MaleCNS v0.9 to v1.0 pC1_4a/b:12442,16719,17867,20117,20803,23968,519518,522419. The initial coexpress_high filter excluded these dsx_high cells. Secondary readout: original49-cellcohort. There are375 real mAL→primarytarget edges totaling4251 anatomical synapse counts.

Artificial tonic depolarizing drive during100–600ms is applied equally to these eight cells. Three fixed magnitudes8,10,14mV bracket the intrinsic7mV resting-to-threshold gap; they are chosen analytically, not fitted to observed output. This is a model current expressed as its steady-state voltage contribution. No imposed target choice or sensory preference.

Four conditions, identical background model and paired random stimulation:
1. Tonic P1 drive alone.
2. Same tonic drive plus150Hz/cell time-discretized Poisson activation of75 GABA mAL cells.
3. Same inputs as2, with all mAL outgoing transmission blocked.
4. Same inputs as2, with only mAL→eightP1 connections blocked, retaining indirect mAL effects.

All original graph edges, all neurons, original fast-transmitter assumptions and published-reference LIF constants retained.700ms total trial (100baseline,500drive,100washout),0.1ms timestep. Baseline no background activity. External mAL voltage impulses68.75mV and zero refractory, as in reference activation model. Explicit subthreshold tonicdrive avoids directly forcing everyP1spike. Synaptic arrivals during refractory are discarded. Exact linear subthreshold update includes tonicdrive.

Fixed grid:3drivelevels×4conditions×5seeds(1–5)=60trials. Primary confirmation:10mV×4conditions×10newseeds(101–110)=40trials, run regardless of initial outcome. Seed schedule hashed and reused for all conditions. Two zero-tonic controls atseed1: noinput, and mALactivationonly.

Measure primary andsecondary firingrates during500ms stimulation, number ofactiveprimarycells, total networkspikes, recorded binned spike counts, globalvoltageextrema. Maincontrast: P1activity in coactivation versus identical coactivation with mALoutputblock; report all drives and seeds. Restoration means removing experimentalblock, which must reproduce coactivation using same inputs; verify one seed directly. No significance or realpreference claim. Report if voltage extremes suggest limitations of this unbounded current model. Preserve nullresults.
