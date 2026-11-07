# INI-CET rank checker

A static website that shows closing ranks for every MD, MS, MCh/DM (6 year) and MDS branch at AIIMS, JIPMER, PGIMER, NIMHANS and SCTIMST. It uses the INI-CET January 2025 and January 2026 seat allocation results (Round 1, Round 2 and the open round).

Students enter their rank, category and quota. The site then shows:
- **Check my rank:** your chance at each college for a branch, or for all branches.
- **Compare branches:** how many colleges your rank reaches in each branch.
- **Cutoff tables:** category-wise closing ranks for any branch.
- **All allotments:** every allotted seat, which you can filter.

## Layout

| Path | What it is |
|---|---|
| `docs/index.html` | The built site. GitHub Pages serves it from `/docs`. |
| `src/` | The page's head (styles), body markup and app script. |
| `data/alldata.js` | Normalised allotments embedded in the page (7,238 rows). |
| `data/allotments_raw.json` | Parsed rows before branch names were normalised. |
| `scripts/parseall.py` | Extracts allotments from the result notifications converted to text (`pdftotext -layout`). |
| `scripts/norm.py` | Groups branch names that differ by institute and writes `data/alldata.js`. |
| `scripts/build.sh` | Puts `src/` and the data together into `docs/index.html`. |

## Rebuilding

1. Convert each result PDF with `pdftotext -layout`. Save the 2026 files as `r1.txt`, `r2.txt`, `r3.txt` and the 2025 files as `y1.txt`, `y2.txt`, `y3.txt`.
2. Run `python3 scripts/parseall.py && python3 scripts/norm.py` in that folder. Then copy `alldata.js` into `data/`.
3. Run `scripts/build.sh`.

## Sources

AIIMS New Delhi result notifications:
- Jan 2026: No. 327/2025 (Round 1), 02/2026 (Round 2), 69/2026 (open round)
- Jan 2025: No. 168/2024 (Round 1), 01/2025 (Round 2), 28/2025 (open round)

## Notes

- Categories follow the seat's roster point, not the candidate's own category.
- The result files don't say whether a course is MD or MS. Anatomy, Obstetrics & Gynaecology and Ophthalmology are listed as "Undefined (MD or MS)".
- Past closing ranks are a guide, not a guarantee.
