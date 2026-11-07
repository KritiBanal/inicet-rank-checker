# INI-CET rank checker

A static website that shows closing ranks for every MD, MS, MCh/DM (6 year) and MDS branch at AIIMS, JIPMER, PGIMER, NIMHANS and SCTIMST. It uses the INI-CET January 2025, January 2026 and July 2026 seat allocation results (Round 1, Round 2 and the open round).

Students enter their rank, category and quota. The site then shows:
- **Check my rank:** your chance at each college for a branch, or for all branches.
- **Compare branches:** how many colleges your rank reaches in each branch.
- **Cutoff tables:** category-wise closing ranks for any branch.
- **All allotments:** every allotted seat, which you can filter.
- **January 2027 predictions** (`predictions.html`, linked at the foot of the checker): estimated closing ranks for every college, branch and seat category, a weighted average of the last three sessions (Jan 2026 45%, Jul 2026 35%, Jan 2025 20%), plus where a rank stands within its category on the January 2027 qualified list.
- **Colleges:** a page for each institute with its stipend, fees, bond, course length, hostel, seats filled per branch and closing ranks. Each figure links to the official INI-CET prospectus it comes from, and anything the prospectus doesn't state is marked.

## Layout

| Path | What it is |
|---|---|
| `docs/index.html` | The built site. GitHub Pages serves it from `/docs`. |
| `src/` | The page's head (styles), body markup and app script. |
| `src/colleges.js` | Facts for each institute (stipend, fees, bond, hostel) with source links. |
| `data/alldata.js` | Normalised allotments embedded in the page (10,850 rows). |
| `data/allotments_raw.json` | Parsed rows before branch names were normalised. |
| `scripts/parseall.py` | Extracts allotments from the result notifications converted to text (`pdftotext -layout`). |
| `scripts/norm.py` | Groups branch names that differ by institute and writes `data/alldata.js`. |
| `scripts/build.sh` | Puts `src/` and the data together into `docs/index.html` and `docs/predictions.html`. |
| `scripts/predict.py` | Writes `data/predictions.js` from `data/alldata.js`; pass the January 2027 rank list text (`pdftotext`) to refresh its qualified counts. |
| `src/predict.html`, `src/predict.js` | The predictions page. |

## Rebuilding

1. Convert each result PDF with `pdftotext -layout`. Save January 2026 as `r1.txt`, `r2.txt`, `r3.txt`, January 2025 as `y1.txt`, `y2.txt`, `y3.txt`, and July 2026 as `j1.txt`, `j2.txt`, `j3.txt`.
2. Run `python3 scripts/parseall.py && python3 scripts/norm.py` in that folder. Then copy `alldata.js` into `data/`.
3. Run `python3 scripts/predict.py [rank-list.txt]`.
4. Run `scripts/build.sh`.

## Sources

AIIMS New Delhi result notifications:
- Jan 2027 qualified list: No. 304/2026
- Jul 2026: No. 205/2026 (Round 1), 216/2026 (Round 2), 261/2026 (open round)
- Jan 2026: No. 327/2025 (Round 1), 02/2026 (Round 2), 69/2026 (open round)
- Jan 2025: No. 168/2024 (Round 1), 01/2025 (Round 2), 28/2025 (open round)

## Notes

- Categories follow the seat's roster point, not the candidate's own category.
- The result files don't say whether a course is MD or MS. Anatomy, Obstetrics & Gynaecology and Ophthalmology are listed as "Undefined (MD or MS)".
- Past closing ranks are a guide, not a guarantee.
