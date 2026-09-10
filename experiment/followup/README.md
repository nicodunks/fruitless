# Follow-up experiments

Start with [RESULTS.md](RESULTS.md). These experiments do not modify the original viewer.

Using the environment described in `../README.md`, reproduce the two main follow-ups from the repository root:

```sh
.venv/bin/python experiment/prepare.py .experiment-data
.venv/bin/python experiment/followup/brake.py .experiment-data
.venv/bin/python experiment/followup/bounded_routes.py .experiment-data
```

`bounded-route-recordings.npz` contains every final sensory trial. Each member is a structured array with `bin` (10 ms), `neuron` (index), and `count` (spikes). The index maps to `../neuron-ids.u32`; soma coordinates are in `../positions.f32`. These are genuine simulated spike counts, not display pulses. `exploratory-route-recordings.npz` uses the same format for all 63 exploratory/holdout/restoration recordings.

`audit-source.zip` preserves the independent audit scripts and reports in their original `work/circuit/` working layout. To rerun those scripts, prepare source data at `work/circuit` instead of `.experiment-data`, extract the archive into the repository root, then execute the scripts from the repository root. Run `work/circuit/biology-audit/routes.py` before `holdout.py`. `work/circuit/model-audit/bounded-brake/run.py` reproduces the independent bounded brake test; `controls.py` reproduces its zero-tonic controls. The optional Brian2 numerical check additionally requires `brian2==2.6.0`; the saved script uses its Python queue for NumPy 2 compatibility. Data are public and checksum-pinned by the original preparation script.

Two terminology corrections to the frozen brake protocol: the 8/10/14 mV tonic contributions exceed the resting-to-threshold gap and are continuous depolarizing drive, not “subthreshold” steady-state drive. “Restoration” checks restart the same configuration rather than dynamically reversing an intervention in one trial. The implementation also included the two blocked-output zero-tonic controls, in addition to the two controls described in the prose protocol; all four are reported.

The bounded sensory protocol records an early design correction: signs must remain identical across male/female inputs. The first partial launch was stopped before interpreting its outcomes, preserved in the audit archive, and superseded by the complete fixed 36-run matched-network design. No favorable run was selected from it.
