"""Build data/predictions.js: estimated INI-CET January 2027 closing ranks.

Usage: python3 scripts/predict.py [ranklist.txt]

Reads data/alldata.js (past allotments). The optional argument is the January
2027 qualified-candidate result (notification 304/2026) converted to text; it
adds this year's qualified counts and category depth. Without it, the rank
list part of data/predictions.js is kept as it was.

Estimate = recency-weighted average of past closing ranks per college, branch
and seat category: Jan 2026 45%, Jul 2026 35%, Jan 2025 20%, rescaled over the
sessions in which that seat was allotted.
"""
import json, re, sys, os, collections
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
src = open(os.path.join(ROOT, 'data/alldata.js')).read()
D = json.loads(src[src.index('{'):src.rstrip().rstrip(';').rindex('}') + 1])
C, I, B, S = D['cats'], D['insts'], D['brs'], D['seats']
W = {0: 0.20, 1: 0.45, 2: 0.35}  # session index: 0 Jan 2025, 1 Jan 2026, 2 Jul 2026
CATS = ['UR', 'OBC', 'EWS', 'SC', 'ST']

g = collections.defaultdict(dict)
for y, r, rank, ci, ii, bi, si, raw in D['rows']:
    seat = S[si]
    if seat not in CATS:
        continue
    d = g[(bi, ii, seat)].setdefault(y, {'r1': None, 'fin': 0, 'n1': 0})
    if r == 1:
        d['r1'] = max(d['r1'] or 0, rank); d['n1'] += 1
    d['fin'] = max(d['fin'], rank)

def wm(vals):
    vals = {y: v for y, v in vals.items() if v is not None}
    if not vals:
        return None
    t = sum(W[y] for y in vals)
    return round(sum(W[y] * v for y, v in vals.items()) / t)

rows = []
for (bi, ii, c), ys in sorted(g.items()):
    fin = {y: d['fin'] for y, d in ys.items()}
    lo, hi, n = min(fin.values()), max(fin.values()), len(fin)
    conf = 'Higher' if n == 3 and hi / lo < 1.6 else 'Medium' if n >= 2 and hi / lo < 2.2 else 'Low'
    rows.append([bi, ii, CATS.index(c), fin.get(0), fin.get(1), fin.get(2),
                 wm({y: d['r1'] for y, d in ys.items()}), wm(fin), lo, hi,
                 max(d['n1'] for d in ys.values()), conf])

out_path = os.path.join(ROOT, 'data/predictions.js')
rl = None
if len(sys.argv) > 1:
    sec = None; recs = []
    for l in open(sys.argv[1], encoding='utf8'):
        l = l.strip()
        if l.startswith('MD, MS, MCH'): sec = 'MD'
        elif l == 'MDS': sec = 'MDS'
        m = re.match(r'^(\d{7}) (UR|OBC|SC|ST|EWS) (\w+)(?: (\S+))? (\d+) ([\d.]+)$', l)
        if m and m[3] == 'General':
            recs.append((sec, m[2], int(m[5])))
    rl = {}
    for s in ('MD', 'MDS'):
        rl[s] = {}
        for c in CATS:
            rr = sorted(r for ss, cc, r in recs if ss == s and cc == c)
            step = 25 if s == 'MD' else 5
            pts = [[k + 1, rr[k]] for k in range(0, len(rr), step)] + [[len(rr), rr[-1]]]
            rl[s][c] = {'n': len(rr), 'pts': pts}
elif os.path.exists(out_path):
    old = open(out_path).read()
    rl = json.loads(old[old.index('{'):old.rstrip().rstrip(';').rindex('}') + 1]).get('rl')

P = {'insts': I, 'brs': B, 'cats': CATS, 'rows': rows, 'rl': rl}
open(out_path, 'w').write('const P=' + json.dumps(P, separators=(',', ':')) + ';')
print('wrote', out_path, len(rows), 'rows', os.path.getsize(out_path), 'bytes')
