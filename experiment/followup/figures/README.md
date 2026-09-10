# Figures

`cue-response-comparison.png` compares both candidate sensory inputs, paired within seed. Colored diamonds are means; the small circles show all three seeds. Counts are spikes across the fixed eight-cell readout during the 250 ms response window. Separate panels show the two inhibitory reversal assumptions. All plotted values are in `figure-data.csv`.

After mAL output block, the ratio of the mean female-cue response to the mean male-cue response was 5.6 for −70 mV and 5.5 for −80 mV. These are **neural response ratios**, not probabilities or strengths of mating preference.

`experiment-explained.png` is a conceptual schematic, not an anatomical pathway diagram. The model includes the full classified graph, while the predefined readout measures eight cells. See `../RESULTS.md` for the cell-mapping and transmitter-sign limitations.

SVG versions preserve editable text. `fruitless-experiment-figures.pdf` contains both figures. Reproduce with `matplotlib==3.9.4` and `numpy==2.0.2` by running `make_figures.py`; it reads the final measured JSON directly and does not invent a preference score.
