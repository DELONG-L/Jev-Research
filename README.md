# Jev Research Explorer

**Website:** [English](https://delong-l.github.io/Jev-Research/?lang=en#top) · [中文](https://delong-l.github.io/Jev-Research/?lang=zh#top)

Jev Research Explorer brings together three studies from the [UTSCybeR lab](https://utscyber.com/) on intent interpretation and decision-making in communication networks. The page is intended for communications researchers and engineers who want to examine how decision quality, response time, queueing and execution affect network and service outcomes.

The website follows a control loop from intent and network state through decision, execution and verification. Its sections are organized by research direction, with the supporting papers and datasets linked alongside the evidence. Interactive views let readers inspect recorded conditions, compare models and identify the endpoint behind each result.

## Explore the page

| Research direction | What you can investigate |
| --- | --- |
| [Wireless network control](https://delong-l.github.io/Jev-Research/?lang=en#radio-timing) | Radio service outcomes, policy correctness, timing budgets, queueing and the A1/E2 control path |
| [Edge service orchestration](https://delong-l.github.io/Jev-Research/?lang=en#edge-orchestration) | Correct service completion under different loads, deadlines, cache conditions and OCR workloads |
| [Closed-loop verification](https://delong-l.github.io/Jev-Research/?lang=en#control-verification) | The difference between a decision, an acknowledged action and a verified outcome; the effects of queues and constraint checks |

The opening question buttons lead directly to a radio scenario map, a timing-target lookup, an A/B comparison or a guided verification walkthrough.

### Wireless network control

This section connects interpretation quality and timing to Open RAN control and radio performance. Five views cover different parts of that connection:

- **Radio outcomes:** Select arrival rates and UE speeds in a scenario map. Inspect affected-class and network SLA violations, cell-edge throughput and packet delay. Switch between absolute values and changes from the base condition, then expand the results for model comparisons and available confidence intervals.
- **Policy quality:** Compare full-policy correctness and timing fit under the selected telemetry condition. The view also reports the measured API fee per 1,000 correct policies.
- **Deadline fit:** Move the timing budget from 10 ms to 10 s and inspect each model's miss rate. Toggle curves, choose a required on-time percentage, and find the first sampled budget that meets the target. The curves cover 4,800 calls per model at 61 sampled budgets.
- **Load and queues:** Inspect one-second attainment across measured intent arrival rates, alongside queue p95 and utilization for four interpretation slots.
- **Control path:** Compare interpretation, A1 delivery and E2 control acknowledgment on the srsRAN and O-RAN SC software stack. Radio observation through KPM is presented separately from acknowledgment.

The page identifies which results come from simulated radio outcomes, live model calls, modeled enforcement or a real software stack. The 3.96 percentage-point SLA result reports headroom from ideal policy execution relative to no update.

### Edge service orchestration

This section examines whether supported requests are interpreted correctly and completed before their deadline. Readers can switch between **live admission with modeled service execution** and a **real OCR service**.

- **Measured condition sweeps:** Explore arrival load, request deadlines and semantic cache reuse. For OCR, compare steady and bursty arrivals, recurring and changing descriptions, and cache on or off.
- **A/B comparison:** Pin one condition as A, change B, or swap the two. Presets provide examples such as 1 versus 16 requests/s and cache off versus on. Each model retains both completion counts and request p95 beside the completion-rate difference.
- **Service outcome details:** Inspect the selected condition's correct, on-time completion counts. The OCR view also separates compliant, timely execution, exact recognized text and rejection of unsupported requests.

Request p95 is calculated over each model's own completed requests. The page keeps it beside completion counts so readers can assess latency together with how many requests actually finish.

### Closed-loop verification

This section examines how timing endpoints, queueing and check responsibility affect a control-loop result.

- **Endpoint walkthrough:** Select transport or edge execution and a controlled decision delay. Step through the decision, execution ACK and verified outcome, then inspect a separate queue-and-replay experiment. The guide shows reported aggregates at each checkpoint.
- **Queue inspection:** Change the measured arrival rate to inspect verified-outcome latency, deadline attainment and utilization. These results use a real single-slot FIFO queue with execution times replayed from measured physical runs.
- **Constraint checks:** Inspect constructed tasks involving missing contract candidates, infeasible forwarding instances and different constraint structures. Compare the reported self-check and public-gate workflow results.
- **Literature explorer:** Search 139 research families by title or execution path and filter by decision interface. Inspect reporting coverage and check ownership. Of 50 families claiming control-loop or timing fit, four provide matched measurement; related papers and versions are grouped as one family.

## Languages and interaction

The page supports English and Chinese. Switching language preserves selected experimental conditions and exploration state. The layout adapts to desktop and mobile screens, and controls support keyboard navigation. With reduced motion enabled, animations are disabled and the walkthrough remains available through manual checkpoints.

## Data and interpretation

All charts use recorded aggregate results from the supporting studies. Changing a control selects an existing experimental condition. The timing-target lookup uses sampled budgets without interpolation.

Timing fit, policy correctness and verified service completion have their own definitions and denominators. Each section provides expandable measurement notes to help readers interpret the comparisons.

The [studies and data section](https://delong-l.github.io/Jev-Research/?lang=en#studies) links to the papers, research code and datasets. Readers can also [download the chart data as JSON](https://delong-l.github.io/Jev-Research/explorer-data.json) or view and copy the same data within the page.

## Research sources

| Direction | Preprint | Code and full data |
| --- | --- | --- |
| Wireless network control | [Intent Interpretation at RIC Timescales](https://arxiv.org/abs/2609.23136v2) | [Code](https://github.com/OniReimu/6G-JEV) · [Data](https://huggingface.co/datasets/OniReimu/6G-JEV) |
| Edge service orchestration | [Replacing Large Language Models with Jev Decision Models](https://arxiv.org/abs/2609.22753v2) | [Code](https://github.com/OniReimu/Edge-Computing-JEV) · [Data](https://huggingface.co/datasets/OniReimu/Edge-Computing-JEV) |
| Closed-loop verification | [SoK: Semantic Decision Engines in Network Control Loops](https://arxiv.org/abs/2610.06425v1) | [Code](https://github.com/OniReimu/SoK-JEV) · [Data](https://huggingface.co/datasets/OniReimu/SoK-JEV) |

## License

The website source is released under the [MIT License](LICENSE). The bundled IBM Plex fonts retain their [SIL Open Font License 1.1](assets/fonts/OFL.txt).
