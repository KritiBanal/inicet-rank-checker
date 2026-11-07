const RN={1:'Round 1',2:'Round 2',3:'Open round'};
const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString('en-IN');
const VERD={strong:['c-strong','Strong chance'],good:['c-good','Good chance'],warn:['c-warn','Borderline'],bad:['c-bad','Unlikely']};
const ORDER={strong:0,good:1,warn:2,bad:3};
const B=D.brs, I=D.insts, S=D.seats, C=D.cats;
// MCh, DM and MDS are stated in the result files. MD/MS is not, so only branches taught under a single degree are typed; the rest stay Undefined.
const MS=['General Surgery','Orthopaedics','ENT'];
const UNDEF=['Anatomy','Obstetrics & Gynaecology','Ophthalmology'];
const TYPE=B.map(b=>b.startsWith('MDS:')?'MDS':/MCh 6 yr/.test(b)?'MCh':/DM 6 yr/.test(b)?'DM':UNDEF.includes(b)?'Undefined':MS.includes(b)?'MS':'MD');
const TYPES=()=>new Set([...document.querySelectorAll('.ptype:checked')].map(x=>x.value));
const typeOk=bi=>TYPES().has(TYPE[bi]);
const seatLabel=s=>s==='IP'?'IP (AIIMS institutional)':s==='INST'?'INST (JIPMER institutional)':s==='OCS'?'OCS (open category)':s;
// branch select with groups
(function(){$('branch').appendChild(new Option('All branches','-1'));const g={'MD / MS':[],'MCh / DM (6 year)':[],'MDS':[]};
B.forEach((b,i)=>{(b.startsWith('MDS:')?g['MDS']:/\((MCh|DM) 6 yr\)/.test(b)?g['MCh / DM (6 year)']:g['MD / MS']).push([b,i])});
for(const k in g){const og=document.createElement('optgroup');og.label=k;g[k].forEach(([b,i])=>og.appendChild(new Option(b.replace('MDS: ',''),i)));$('branch').appendChild(og)}
$('branch').value=B.indexOf('Emergency Medicine')})();
let state={tab:'check'};
const Y=()=>+$('year').value, BR=()=>+$('branch').value;
function fill(id,vals,label){const el=$(id),keep=el.value;while(el.options.length>1)el.remove(1);vals.forEach(v=>el.add(new Option(label?label(v):v,v)));el.value=vals.map(String).includes(keep)?keep:''}
function options(){
  const rows=D.rows.filter(r=>r[0]===Y());
  const ipi=[...new Set(rows.filter(r=>S[r[6]]==='IP'||S[r[6]]==='INST').map(r=>I[r[4]]))].sort();
  fill('ip',ipi,v=>v.startsWith('JIPMER')?'Graduate of JIPMER Puducherry':'Graduate of '+v);
  fill('f-inst',[...new Set(rows.map(r=>I[r[4]]))].sort());
  fill('f-seat',[...new Set(rows.map(r=>S[r[6]]))].sort(),seatLabel);
}
function user(){return{rank:parseInt($('rank').value,10),cat:$('cat').value,ip:$('ip').value,pwd:$('pwd').checked,spons:$('spons').checked}}
function eligible(r,u){
  const s=S[r[6]];
  if(s==='UR'||s==='OCS')return true;
  if(s===u.cat)return true;
  if(s==='IP'||s==='INST')return !!u.ip&&I[r[4]]===u.ip;
  if(s==='Sponsored')return u.spons;
  if(s.endsWith('-PwBD'))return u.pwd&&(s==='UR-PwBD'||s===u.cat+'-PwBD');
  return false;
}
function assess(rows,u){
  const by={};
  rows.forEach(r=>{const k=r[5]+'|'+r[4],o=by[k]||(by[k]={inst:I[r[4]],br:B[r[5]],rd:{}});const c=o.rd[r[1]];if(!c||r[2]>c.close)o.rd[r[1]]={close:r[2],seat:S[r[6]]}});
  return Object.values(by).map(o=>{
    o.best=Math.max(...Object.values(o.rd).map(x=>x.close));
    const rk=u.rank;
    o.v=!rk?null:(o.rd[1]&&rk<=o.rd[1].close)?'strong':rk<=o.best?'good':rk<=o.best*1.15?'warn':'bad';
    return o});
}
function check(){
  const u=user(),b=BR();
  const seats=['UR','OCS'].concat(u.cat!=='UR'?[u.cat]:[]).concat(u.pwd?['PwBD']:[]).concat(u.ip?['institutional at '+u.ip]:[]).concat(u.spons?['Sponsored']:[]);
  const allB=b<0;$('unl-wrap').hidden=!allB;
  $('explain').textContent=(allB?'All branches':B[b].replace('MDS: ','MDS '))+', January '+(2025+Y())+'. Comparing against seats you can take: '+seats.join(', ')+'.';
  const items=assess(D.rows.filter(r=>r[0]===Y()&&(allB?typeOk(r[5]):r[5]===b)&&eligible(r,u)),u);
  items.sort((a,c)=>(ORDER[a.v]??0)-(ORDER[c.v]??0)||(allB?a.best-c.best:c.best-a.best));
  const cnt={strong:0,good:0,warn:0,bad:0};items.forEach(o=>o.v&&cnt[o.v]++);
  $('summary').innerHTML=u.rank&&items.length?Object.keys(VERD).map(k=>`<span class="chip ${VERD[k][0]}">${cnt[k]} ${VERD[k][1].toLowerCase()}</span>`).join(''):'';
  let shown=items;
  if(allB&&u.rank&&!$('unl').checked)shown=items.filter(o=>o.v!=='bad');
  $('allnote').textContent=allB?'Every branch and college you can reach, most competitive first within each rating'+(shown.length>300?'. Showing the first 300.':'.'):'';
  if(allB&&shown.length>300)shown=shown.slice(0,300);
  if(!items.length){$('list').innerHTML='<div class="empty">No seats in this branch match your category and quota settings for this session.</div>';return}
  if(!shown.length){$('list').innerHTML='<div class="empty">No branch and college reached your rank this session. Tick Show unlikely options to see the nearest ones.</div>';return}
  const max=Math.max(u.rank||0,...shown.map(o=>o.best))*1.05,pos=v=>(v/max*100).toFixed(2)+'%';
  $('list').innerHTML=shown.map(o=>{
    const v=o.v?VERD[o.v]:null;
    const cells=[1,2,3].map(k=>{const x=o.rd[k];return `<div><small>${RN[k]}</small>${x?`<b>${fmt(x.close)}</b><em>closed on ${x.seat} seat</em>`:'<b>–</b><em>no allotment</em>'}</div>`}).join('');
    const marks=[1,2,3].filter(k=>o.rd[k]).map(k=>`<span class="mk r${k}" style="left:${pos(o.rd[k].close)}" title="${RN[k]}: ${fmt(o.rd[k].close)}"></span>`).join('');
    return `<article class="card"><h3>${allB?`${o.br.replace('MDS: ','MDS ')} <span class="at">at ${o.inst}</span>`:o.inst}</h3>${v?`<span class="chip ${v[0]}">${v[1]}</span>`:'<span></span>'}
    <div class="meta">Last rank allotted in any round: ${fmt(o.best)}${u.rank?(u.rank<=o.best?` · you are ${fmt(o.best-u.rank)} ranks inside it`:` · you are ${fmt(u.rank-o.best)} ranks past it`):''}</div>
    <div class="rounds">${cells}</div>
    <div class="scale" aria-hidden="true"><span class="track"></span>${marks}${u.rank?`<span class="you" style="left:${pos(u.rank)}"></span>`:''}</div></article>`}).join('');
}
function compare(){
  const u=user(),y=Y();
  const res=B.map((name,bi)=>{if(!typeOk(bi))return{n:0};const it=assess(D.rows.filter(r=>r[0]===y&&r[5]===bi&&eligible(r,u)),u);
    const c={strong:0,good:0,warn:0,bad:0};it.forEach(o=>o.v&&c[o.v]++);
    return{bi,name,c,n:it.length,best:it.length?Math.max(...it.map(o=>o.best)):0}}).filter(x=>x.n);
  res.sort((a,b)=>(b.c.strong+b.c.good)-(a.c.strong+a.c.good)||b.c.warn-a.c.warn||b.best-a.best);
  $('cbody').innerHTML=res.map(x=>`<tr class="click" data-b="${x.bi}" tabindex="0"><th scope="row">${x.name.replace('MDS: ','').replace(/ \((MCh|DM) 6 yr\)/,'')} <span class="tt">${TYPE[x.bi]==="Undefined"?"MD or MS":TYPE[x.bi]}</span></th><td class="r">${x.c.strong||'–'}</td><td class="r">${x.c.good||'–'}</td><td class="r">${x.c.warn||'–'}</td><td class="r">${x.n}</td><td class="r">${fmt(x.best)}</td></tr>`).join('');
}
$('cbody').addEventListener('click',e=>{const tr=e.target.closest('tr[data-b]');if(tr){$('branch').value=tr.dataset.b;tab('check')}});
$('cbody').addEventListener('keydown',e=>{if(e.key==='Enter'){const tr=e.target.closest('tr[data-b]');if(tr){$('branch').value=tr.dataset.b;tab('check')}}});
const TORDER=['UR','OCS','EWS','OBC','SC','ST','UR-PwBD','EWS-PwBD','OBC-PwBD','SC-PwBD','ST-PwBD','IP','INST','Sponsored','Foreign National'];
function tables(){
  if(BR()<0){$('tables').innerHTML=B.map((n,i)=>!typeOk(i)?'':`<button class="blink" data-b="${i}">${n}</button>`).join('');$('tables').insertAdjacentHTML('afterbegin','<p class="note">Pick a branch to see its category-wise tables.</p>');return}
  const rows=D.rows.filter(r=>r[0]===Y()&&r[5]===BR());
  const g={};rows.forEach(r=>{const s=S[r[6]];((g[s]=g[s]||{})[I[r[4]]]=g[s][I[r[4]]]||{});const x=g[s][I[r[4]]];(x[r[1]]=x[r[1]]||[]).push(r[2])});
  const keys=Object.keys(g).sort((a,b)=>((TORDER.indexOf(a)+99)%99+(a.startsWith('Other')?50:0))-((TORDER.indexOf(b)+99)%99+(b.startsWith('Other')?50:0)));
  if(!keys.length){$('tables').innerHTML='<div class="empty">No allotments in this branch for this session.</div>';return}
  const pwdNone=!keys.some(k=>k.endsWith('PwBD'));
  const cell=v=>!v?'<td class="na r">–</td>':`<td class="r"><b>${fmt(Math.max(...v))}</b>${v.length>1?`<span class="op">opens ${fmt(Math.min(...v))} · ${v.length} seats</span>`:''}</td>`;
  $('tables').innerHTML=keys.map(k=>{const d=g[k];const ins=Object.keys(d).map(i=>[i,Math.max(...Object.values(d[i]).flat())]).sort((a,b)=>a[1]-b[1]);
    return `<div class="sec"><h3>${seatLabel(k)}</h3><div class="tw"><table><thead><tr><th>Institute</th><th class="num">Round 1</th><th class="num">Round 2</th><th class="num">Open round</th><th class="num">Last rank allotted</th></tr></thead><tbody>${ins.map(([i,m])=>`<tr><th scope="row">${i}</th>${[1,2,3].map(x=>cell(d[i][x])).join('')}<td class="fin">${fmt(m)}</td></tr>`).join('')}</tbody></table></div></div>`}).join('')
    +(pwdNone?'<p class="note">No PwBD seat was allotted in this branch in this session.</p>':'');
}
$('tables').addEventListener('click',e=>{const t=e.target.closest('.blink');if(t){$('branch').value=t.dataset.b;tables()}});
let sortK=2,sortDir=1;
function table(){
  const R=$('f-round').value,In=$('f-inst').value,Se=$('f-seat').value,M=parseInt($('f-max').value,10),all=BR()<0;
  let rows=D.rows.filter(r=>r[0]===Y()&&(all?typeOk(r[5]):r[5]===BR())&&(!R||r[1]==R)&&(!In||I[r[4]]===In)&&(!Se||S[r[6]]===Se)&&(!M||r[2]<=M));
  const val=(r,k)=>k===3?C[r[3]]:k===4?I[r[4]]:k===5?B[r[5]]:r[k];
  rows.sort((a,b)=>{const x=val(a,sortK),y=val(b,sortK);return (typeof x==='number'?x-y:String(x).localeCompare(y))*sortDir||a[2]-b[2]});
  const total=rows.length;rows=rows.slice(0,500);
  $('count').textContent=fmt(total)+' allotments'+(total>500?', showing the first 500. Narrow the filters to see more.':'');
  $('tbody').innerHTML=rows.map(r=>`<tr><td class="num r">${fmt(r[2])}</td><td>${C[r[3]]}</td><td>${B[r[5]]}</td><td>${I[r[4]]}</td><td>${r[7]||S[r[6]]}</td><td>${RN[r[1]]}</td></tr>`).join('');
  document.querySelectorAll('#pane-all thead th').forEach(th=>th.setAttribute('aria-sort',th.dataset.k==sortK?(sortDir>0?'ascending':'descending'):'none'));
}
document.querySelectorAll('#pane-all thead th').forEach(th=>th.addEventListener('click',()=>{const k=+th.dataset.k;sortDir=k===sortK?-sortDir:1;sortK=k;table()}));
function render(){({check,compare,table:tables,all:table})[state.tab]()}
['rank','cat','ip','pwd','spons','branch','unl'].forEach(id=>$(id).addEventListener('input',render));
document.querySelectorAll('.ptype').forEach(x=>x.addEventListener('input',render));
$('year').addEventListener('input',()=>{options();render()});
['f-round','f-inst','f-seat','f-max'].forEach(id=>$(id).addEventListener('input',table));
function tab(t){state.tab=t;['check','compare','table','all'].forEach(x=>{$('tab-'+x).setAttribute('aria-selected',x===t);$('pane-'+x).hidden=x!==t});render()}
['check','compare','table','all'].forEach(x=>$('tab-'+x).onclick=()=>tab(x));
function setTheme(t,save){
  if(t)document.documentElement.setAttribute('data-theme',t);else document.documentElement.removeAttribute('data-theme');
  document.querySelectorAll('.theme button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.t===t));
  if(save){try{localStorage.setItem('theme',t)}catch(e){}}
}
document.querySelectorAll('.theme button').forEach(x=>x.addEventListener('click',()=>setTheme(x.dataset.t,true)));
(function(){let t=null;try{t=localStorage.getItem('theme')}catch(e){}
  setTheme(t||'',false)})();
options();render();
