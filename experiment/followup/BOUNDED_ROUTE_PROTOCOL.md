# Bounded route confirmation

Design correction: the first launch varied the female-input sign assumption by stimulated population. That would confound cross-input comparisons, although within-input intervention pairs were matched. The launch was stopped before interpreting its outcomes, its partial log retained, and the fixed 36-run design restarted with both sign overrides present in every input condition. No amplitudes, seeds, readouts, or outcome thresholds were changed.

Purpose: test whether the exploratory male-candidate response increase under mAL output block survives a model that prevents unphysiological inhibitory voltages. This is conditional confirmation of a neural response, not preference.

Full166606neuron graph and sameconnections. Samecandidate male37/female27inputs, published vAB3e/f group4neurons, eightliteraturematchedP1readout andoriginal49secondary. Time300ms, stimulus50–250ms, rate5550events/s dividedovercandidatepopulation or150Hz/cell fordirectvAB3. No background, no tonicP1drive, noforcedreadoutspikes.

vAB3e/f outgoing sign assumed excitatory based on functional literature. Female-candidate outgoing sign additionally assumed excitatory for ALL three input conditions, as in the earlier sensitivity. The network/signs are identical across input populations as well as intervention pairs. Neither is a measured per-synapse receptor model. Original conservative-sign failures remain recorded elsewhere.

Fixed design: two inhibitoryreversalassumptions(−70,−80mV) ×threeinputs(candidateMale,candidateFemale,directvAB3) ×threefreshseeds(11,12,13) ×twointerventions(intact,allmALoutputblocked) =36runs. All conditions run regardless of outcome. Report each, not just positive cells/seeds. Primarycontrast blocked-minus-intact spikecountofeightreadoutcells; secondary49-cellreadout and mALspikes.

Inhibitoryconductance per anatomical synapse is0.275/(−52−Einh), calibrating the driving current to the original model atrest. Conductance decays5ms and is heldconstantwithin0.1ms voltageintegration; excitatorycurrent exponential integratedanalytically. Delay1.8ms,membrane20ms,rest/reset−52mV,threshold−45mV,refractory2.2ms,stimulatedcellszero refractory,external68.75mVimpulses. Refractoryincomingeventsdiscarded. All inhibitoryneurons shareoneassumedreversal; receptor/neuromodulatoryuncertaintyremains. Assert all voltages stayaboveEinh.

ExternalBernoullischedule generatedbeforeeachpairusinglegacyNumPyRandomState(seed), giving identicalpercellinputsequenceforintact/block. Savehash,raw10ms spikebins,alloutcomes. ZeroP1response orloss ofdisinhibition would be meaningful modeldependence and will not be tuned away.
