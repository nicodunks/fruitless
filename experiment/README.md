# Full-connectome experiment

Read [RESULTS.md](RESULTS.md) first: this pilot did **not** produce a courtship-related response. The viewer at `/experiment.html` shows recorded network spikes, independently of the original illustrative fly scene.

## Reproduce locally

From the repository root, using Python 3.9–3.12:

```sh
python3 -m venv .venv
.venv/bin/pip install -r experiment/requirements.txt
.venv/bin/python experiment/prepare.py .experiment-data
.venv/bin/python experiment/verify.py
.venv/bin/python experiment/run.py .experiment-data
.venv/bin/python experiment/export.py .experiment-data
npm install
npm start
```

`prepare.py` downloads about 1.2 GB of public MaleCNS source tables if absent, verifies their checksums, and builds the complete classified-neuron graph. Allow several GB of disk and memory. The source tables and intermediate arrays are ignored by Git. The local run used Python 3.9 on Apple silicon; preparation, compilation and download time are separate from the recorded 23.5-second simulation time.

## Files

- `PROTOCOL.md`: fixed design, population definitions, assumptions, limitations and sources.
- `prepare.py`: full graph, transmitter assumptions and population extraction.
- `run.py`: small independently implemented LIF simulator and 31 trials. Not a validated replacement for the published Brian2 implementation.
- `verify.py`: functional checks on tiny networks.
- `results.json`: per-trial outcomes, source checksums, protocol/code hashes and exact group annotations.
- `export.py`: exports raw spike-count bins and generates the results summary.
- `recordings.json`: each trial key maps to `[10_ms_bin, neuron_index, spike_count]` rows, including cells without displayable soma positions.
- `neuron-ids.u32`: all 166,606 body IDs in index order, little-endian uint32.
- `positions.f32`: three little-endian float32 coordinates per neuron (source voxel coordinates); NaN triplets mark missing soma locations. The viewer excludes only these cells from rendering, never from simulation.
- `view.js`: paired, slowed playback; fixed flash scale. Neither view runs a fresh neural simulation.

Data: MaleCNS v1.0, CC BY 4.0, https://male-cns.janelia.org/download/. Cell identity support: Ryba et al. 2026, https://doi.org/10.1016/j.cub.2026.01.071. Circuit experiment: Kallman, Kim & Scott 2015, https://elifesciences.org/articles/11188. Model parameters: Shiu et al., https://doi.org/10.1038/s41586-024-07763-9 and https://github.com/philshiu/Drosophila_brain_model.
