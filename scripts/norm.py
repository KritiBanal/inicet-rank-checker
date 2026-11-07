import json,re,collections
a=json.load(open('all.json'))
MDS=[('conservative','Conservative Dentistry & Endodontics'),('maxil','Oral & Maxillofacial Surgery'),('orthodont','Orthodontics'),('pa?ediatric|pedodont','Paediatric & Preventive Dentistry'),('periodont','Periodontology'),('prosthodont','Prosthodontics'),('public health','Public Health Dentistry')]
MD=[('trauma surgery','Trauma Surgery & Critical Care (MCh 6 yr)'),('traumatology','Traumatology & Surgery'),('internal medicine','General Medicine'),('trauma & emergency|emergency','Emergency Medicine'),
('cardiothora','Cardiothoracic & Vascular Surgery (MCh 6 yr)'),('neuro ?surgery','Neurosurgery (MCh 6 yr)'),('pa?ediatrics? surgery','Paediatric Surgery (MCh 6 yr)'),
('plastic|burn','Plastic & Burns Surgery (MCh 6 yr)'),('surgical gastro','Surgical Gastroenterology (MCh 6 yr)'),('urology','Urology (MCh 6 yr)'),
('neurology','Neurology (DM 6 yr)'),('infectious|dm-id','Infectious Diseases (DM 6 yr)'),
('ana?esth|anesth|aneshte','Anaesthesiology'),('anatomy','Anatomy'),('bioche','Biochemistry'),('biophysics','Biophysics'),
('radiation onc|radiotherapy','Radiation Oncology'),('radio|diagnostic & interventional','Radiodiagnosis'),
('derma','Dermatology'),('otorhino|\\bent\\b','ENT'),('obst|\\bobg\\b|gyn','Obstetrics & Gynaecology'),('ophthal','Ophthalmology'),('ortho','Orthopaedics'),
('forensic|\\bfmt\\b','Forensic Medicine'),('community|\\bcfm\\b|\\bcmfm\\b','Community Medicine'),('^family medicine','Family Medicine'),
('geriatric','Geriatric Medicine'),('hospital admin','Hospital Administration'),('immuno|transfusion','Transfusion Medicine'),
('^lab\\.? med','Laboratory Medicine'),('patholog','Pathology'),('microbio','Microbiology'),('nuclear','Nuclear Medicine'),('palliative','Palliative Medicine'),
('pharmacol','Pharmacology'),('physiology','Physiology'),('\\bpmr\\b|physical medicine','Physical Medicine & Rehabilitation'),('psychiatry','Psychiatry'),
('pulmonary|respiratory','Pulmonary Medicine'),('pa?ediat','Paediatrics'),('general surgery|^surgery','General Surgery'),('general medicine|^medicine','General Medicine')]
def br(sec,s):
  s=re.split(r'Allotted Institute|अ|\*Abbrev|Category Allotted',s)[0].strip().lower()
  for k,v in (MDS if sec=='MDS' else MD):
    if re.search(k,s): return ('MDS: ' if sec=='MDS' else '')+v
  return None
def seatbase(seat):
  s=seat.replace('OBC-NCL','OBC')
  if 'PWBD' in s: return s.split('-')[0]+'-PwBD'
  s=re.sub(r'-\d+(/[A-Z]+)?$','',s)
  if s in('UR','OBC','SC','ST','EWS','IP','INST','OCS','Sponsored','Foreign National'): return s
  return 'Other ('+s+')'
drop=collections.Counter(); out=[]
for r in a:
  b=br(r['sec'],r['subj'])
  if not b: drop[r['subj']]+=1; continue
  out.append([r['y'],r['r'],r['rank'],r['cat'],r['inst'],b,seatbase(r['seat']),r['seat']])
print('kept',len(out),'dropped',sum(drop.values()),drop)
print(collections.Counter(o[6] for o in out))
bc=collections.Counter(o[5] for o in out); print(len(bc)); print(sorted(bc.items()))
em=collections.Counter((o[0],o[1]) for o in out if o[5]=='Emergency Medicine'); print(em)
cats=sorted(set(o[3] for o in out)); insts=sorted(set(o[4] for o in out)); brs=sorted(bc); seats=sorted(set(o[6] for o in out))
SESS={2025:0,2026:1,20267:2}
enc=[[SESS[o[0]],o[1],o[2],cats.index(o[3]),insts.index(o[4]),brs.index(o[5]),seats.index(o[6]),o[7]] for o in out]
open('alldata.js','w').write('const D='+json.dumps(dict(cats=cats,insts=insts,brs=brs,seats=seats,rows=enc),separators=(',',':'))+';')
import os;print(os.path.getsize('alldata.js'))
