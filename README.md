# Jev Research Explorer

A bilingual interactive research page from the [UTSCybeR lab](https://utscyber.com/). It brings together wireless network control, edge service orchestration, and closed-loop verification using public measurement aggregates from three studies.

**Website:** [English](https://delong-l.github.io/Jev-Research/?lang=en#top) · [中文](https://delong-l.github.io/Jev-Research/?lang=zh#top)

## Run locally

Python 3.9 or later is sufficient. The build uses the Python standard library; there are no package-install steps, model calls, or runtime credentials.

```sh
python3 scripts/build.py
python3 scripts/build.py --check
python3 -m http.server 8135 --directory docs
```

Open `http://127.0.0.1:8135/?lang=en#top` or `http://127.0.0.1:8135/?lang=zh#top`.

The generated `docs/index.html` embeds its fonts, scripts, styles, translations and chart data, and can also be opened offline. `docs/explorer-data.json` supplies the HTTP data download.

## Maintain the page

| Location | Purpose |
| --- | --- |
| `src/` | HTML template, CSS, JavaScript, Chinese UI copy and literature summaries |
| `data/explorer-data.json` | Public aggregate data used by every language and interaction |
| `data/provenance.json` | Paper links and hashes identifying the data and font snapshot |
| `assets/fonts/` | Original embedded IBM Plex fonts and their SIL Open Font License |
| `scripts/build.py` | Self-contained build, integrity checks and project-path validation |
| `site.json` | Public URL and repository metadata |
| `docs/` | Generated files published by GitHub Pages |

Edit the source, rebuild, run `--check`, then commit the source and generated `docs/` together. Pages publishes `main` → `/docs` automatically after a push. Language switching retains the selected experimental conditions and exploration state.

When intentionally updating the public data, revise its source description and SHA-256 in `data/provenance.json` together. Scientific comparisons retain the denominators and timing endpoints explained in the page; the build does not reanalyse raw requests.

## Research sources

| Direction | Preprint | Code and full data |
| --- | --- | --- |
| Wireless network control | [Intent Interpretation at RIC Timescales](https://arxiv.org/abs/2609.23136v2) | [Code](https://github.com/OniReimu/6G-JEV) · [Data](https://huggingface.co/datasets/OniReimu/6G-JEV) |
| Edge service orchestration | [Replacing Large Language Models with Jev Decision Models](https://arxiv.org/abs/2609.22753v2) | [Code](https://github.com/OniReimu/Edge-Computing-JEV) · [Data](https://huggingface.co/datasets/OniReimu/Edge-Computing-JEV) |
| Closed-loop verification | [SoK: Semantic Decision Engines in Network Control Loops](https://arxiv.org/abs/2610.06425v1) | [Code](https://github.com/OniReimu/SoK-JEV) · [Data](https://huggingface.co/datasets/OniReimu/SoK-JEV) |

This repository contains the website and its public aggregate snapshot. Manuscript authoring files and complete experiment records are maintained with the respective studies. The starting snapshot is the validated [Sites page](https://jev-research.uxser2024.chatgpt.site/).

## License

The website source is released under the [MIT License](LICENSE). The bundled IBM Plex fonts retain their [SIL Open Font License 1.1](assets/fonts/OFL.txt).
