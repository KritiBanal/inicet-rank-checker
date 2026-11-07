import re,json,collections
INST=re.compile(r'\b(AIIMS ?NEW DELHI|AIIMS ?[A-Z]+|JIPMER,? ?PUDUCHERRY|PGIMER,? ?CHANDIGARH|NIMHANS,? ?BENGALURU|SCTIMST,? ?TRIVANDRUM)\b')
ROW=re.compile(r'^\s*(\d{7})\s+(\d+)\s+(.*)$')
CATS=['Foreign National','FOREIGN NATIONAL','Sponsored','SPONSORED','OBC-NCL','OBC','EWS','SC','ST','UR']
SKIP=re.compile(r'Page \d+ of|Roll No|Rank\s*$|of Allocated Seat|Result Notification|^\s*Over All|Category/Roster|Applied Under|^\s*Rank\b')
def iname(s):
  s=s.replace(',',' ');s=re.sub(r'\s+',' ',s).strip()
  s=s.replace('NIMHANSBENGALURU','NIMHANS BENGALURU')
  if 'NEW DELHI' in s: return 'AIIMS New Delhi'
  m=re.match(r'AIIMS ?([A-Z]+)',s)
  if m: return 'AIIMS '+m.group(1).title()
  return {'JIPMER PUDUCHERRY':'JIPMER Puducherry','PGIMER CHANDIGARH':'PGIMER Chandigarh','NIMHANS BENGALURU':'NIMHANS Bengaluru','SCTIMST TRIVANDRUM':'SCTIMST Trivandrum'}.get(s,s)
def parse(fn,yr,rnd):
  lines=open(fn,encoding='utf-8',errors='replace').read().split('\n')
  sec='MD';recs=[];cur=None;pend=None
  recs_tail=lambda: recs[-1] if recs else None
  def flush():
    if cur: recs.append(cur)
  for ln in lines:
    if re.match(r'^\s*1\.5\.',ln): break
    if re.match(r'^\s*1\.2\. MDS',ln): sec='MDS'
    if re.match(r'^\s*1\.4\. Foreign/Sponsored MDS',ln): sec='MDS'
    if re.match(r'^\s*1\.3\. Foreign/Sponsored MDMS',ln): sec='MD'
    m=ROW.match(ln)
    if m:
      flush(); body=m.group(3)
      # wrapped name printed above the row: subject column starts with the tail of a name
      if pend and re.match(r'^\s*(?:(?:UR|OBC-NCL|OBC|EWS|SC|ST)\s+)?(?:PWBD\s+)?(\(|Years\)|Course\))',body):
        body=re.sub(r'^(\s*(?:(?:UR|OBC-NCL|OBC|EWS|SC|ST)\s+)?(?:PWBD\s+)?)',lambda g:g.group(1)+pend+' ',body,count=1)
        if recs_tail(): recs_tail()[3]=recs_tail()[3][:recs_tail()[3].rfind('  '+pend)] if ('  '+pend) in recs_tail()[3] else recs_tail()[3]
      cur=[sec,m.group(1),int(m.group(2)),body]; pend=None; continue
    if cur and ln.strip() and not SKIP.search(ln) and not re.match(r'^\s*1\.\d',ln):
      cur[3]+='  '+ln.strip(); pend=ln.strip()
    else: pend=None
  flush()
  out=[];
  for sec,roll,rank,txt in recs:
    im=INST.search(txt)
    if not im: continue
    inst=iname(im.group(1))
    after=re.sub(r'(UR|OBC|SC|ST|EWS) - PWBD',r'\1-PWBD',txt[im.end():].strip()); before=txt[:im.start()]
    # continuation text may follow roster on combined line
    roster='';extra=''
    am=re.match(r'^((?:UR|OBC|SC|ST|EWS|IP|INST|PWBD|OCS)(?:-[A-Z]+)*(?:-\d+)?(?:/[A-Z]+)?)?\s*(.*)$',after)
    roster=am.group(1) or ''; extra=am.group(2)
    b=before.strip()
    cat='UR';pw=False
    for c in CATS:
      if b.startswith(c+' ') or b.startswith(c+'  '):
        cat=c;b=b[len(c):].strip();break
    if b.startswith('PWBD'): pw=True;b=b[4:].strip()
    cat={'OBC-NCL':'OBC','SPONSORED':'Sponsored','FOREIGN NATIONAL':'Foreign National'}.get(cat,cat)
    subj=re.sub(r'\s+',' ',(b+' '+extra).strip())
    if cat in('Sponsored','Foreign National'): roster=cat
    out.append(dict(y=yr,r=rnd,rank=rank,cat=cat,pw=pw,inst=inst,subj=subj,sec=sec,seat=roster))
  return out
allr=[]
for fn,yr,rnd in [('r1.txt',2026,1),('r2.txt',2026,2),('r3.txt',2026,3),('y1.txt',2025,1),('y2.txt',2025,2),('y3.txt',2025,3),('j1.txt',20267,1),('j2.txt',20267,2),('j3.txt',20267,3)]:
  o=parse(fn,yr,rnd); allr+=o; print(fn,len(o))
json.dump(allr,open('all.json','w'))
c=collections.Counter(r['seat'] and re.sub(r'-\d+(/[A-Z]+)?$','',r['seat']) for r in allr); print(c)
s=collections.Counter((r['sec'],r['subj']) for r in allr); print(len(s))
for k,v in sorted(s.items()): print(v,k)
