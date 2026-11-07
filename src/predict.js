(function(){
const $=id=>document.getElementById(id),fmt=v=>v==null?'–':v.toLocaleString('en-IN'),esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const R=P.rows.map(r=>({b:r[0],college:P.insts[r[1]],cat:P.cats[r[2]],j25:r[3],j26:r[4],j27:r[5],p1:r[6],pf:r[7],low:r[8],high:r[9],seats:r[10],conf:r[11]}));
const used=[...new Set(R.map(r=>r.b))].sort((a,b)=>P.brs[a].localeCompare(P.brs[b]));
$('p-branch').innerHTML=used.map(b=>`<option value="${b}">${esc(P.brs[b])}</option>`).join('');
$('p-branch').value=String(P.brs.indexOf('Emergency Medicine'));
const st=()=>({b:+$('p-branch').value,cat:$('p-cat').value,rank:(v=>v>0&&v<=40000?v:null)(parseInt($('p-rank').value,10))});
const verdict=(r,k)=>!k?null:(r.p1!=null&&k<=r.p1)?['Likely in R1','var(--good)']:k<=r.pf?['Likely by final','var(--good)']:k<=r.high?['Borderline','var(--warn)']:['Unlikely','var(--muted)'];
const SC=['#8a6fd1','var(--strong)','var(--warn)'];
function render(){
  const s=st(),rows=R.filter(r=>r.b===s.b&&r.cat===s.cat).sort((a,b)=>a.pf-b.pf),bn=esc(P.brs[s.b]);
  $('lg-you').hidden=!s.rank;
  if(!rows.length){$('p-take').innerHTML=`No past allotments on ${s.cat} seats for ${bn}. Try another category.`;$('p-chart').innerHTML='';$('p-tbody').innerHTML='';}
  else{
    const a=rows[0],z=rows[rows.length-1];
    let t=`Estimated final-round closing ranks for <b>${bn}</b> on <b>${s.cat}</b> seats run from <b>${fmt(a.pf)}</b> at ${esc(a.college)} to <b>${fmt(z.pf)}</b> at ${esc(z.college)}.`;
    if(s.rank)t+=` At rank <b>${fmt(s.rank)}</b>, you would reach <b>${rows.filter(r=>s.rank<=r.pf).length}</b> of ${rows.length} colleges by the final round if this session behaves like the last three.`;
    $('p-take').innerHTML=t;
    chart(rows,s);
    $('p-tbody').innerHTML=rows.map(r=>`<tr><td>${esc(r.college)}</td><td class="num">${fmt(r.seats)}</td><td class="num">${fmt(r.j25)}</td><td class="num">${fmt(r.j26)}</td><td class="num">${fmt(r.j27)}</td><td class="num">${fmt(r.p1)}</td><td class="num pr">${fmt(r.pf)}</td><td>${r.conf}</td></tr>`).join('');
  }
  qual(s);
}
function chart(rows,s){
  const el=$('p-chart'),W=Math.max(300,el.clientWidth||600),narrow=W<520,rowH=30,top=24,H=top+rows.length*rowH+8;
  const label=r=>narrow?r.college.replace('AIIMS ','').replace(/ (Puducherry|Chandigarh|Bengaluru|Trivandrum)$/,''):r.college;
  const cv=document.createElement('canvas').getContext('2d');cv.font='12px '+getComputedStyle(document.body).fontFamily;
  const left=Math.ceil(Math.max(...rows.map(r=>cv.measureText(label(r)).width)))+14,right=s.rank?(narrow?86:100):10;
  const raw=Math.max(...rows.map(r=>Math.max(r.high,r.pf)),s.rank||0)*1.06,step=niceStep(raw/(narrow?3:6)),xmax=Math.ceil(raw/step)*step;
  const x=v=>left+(v/xmax)*(W-left-right);
  let g='';
  for(let t=0;t<=xmax;t+=step)g+=`<line x1="${x(t)}" x2="${x(t)}" y1="${top-4}" y2="${H-8}" stroke="var(--line)"/><text x="${x(t)}" y="12" text-anchor="middle" font-size="11" fill="var(--muted)">${fmt(t)}</text>`;
  rows.forEach((r,i)=>{const y=top+i*rowH+rowH/2,v=verdict(r,s.rank);
    g+=`<g class="row" data-i="${i}" transform="translate(0,${y})"><rect class="hit" x="0" y="${-rowH/2}" width="${W}" height="${rowH}" fill="transparent"/>`+
    `<text x="${left-10}" y="4" text-anchor="end" font-size="12" fill="var(--fg)">${esc(label(r))}</text>`+
    `<rect x="${x(r.low)-3}" y="-3" height="6" rx="3" width="${Math.max(6,x(r.high)-x(r.low)+6)}" fill="var(--line)"/>`+
    [r.j25,r.j26,r.j27].map((v,k)=>v==null?'':`<circle cx="${x(v)}" r="3.5" fill="${SC[k]}" stroke="var(--panel)" stroke-width="1.5"/>`).join('')+
    (r.p1!=null?`<circle cx="${x(r.p1)}" r="5.5" fill="var(--panel)" stroke="var(--accent)" stroke-width="2"/>`:'')+
    `<rect x="${x(r.pf)-5}" y="-5" width="10" height="10" rx="1.5" transform="rotate(45 ${x(r.pf)} 0)" fill="var(--accent)" stroke="var(--panel)" stroke-width="1.5"/>`+
    (v?`<text x="${W-2}" y="4" text-anchor="end" font-size="11" font-weight="600" fill="${v[1]}">${v[0]}</text>`:'')+`</g>`});
  if(s.rank)g+=`<line x1="${x(s.rank)}" x2="${x(s.rank)}" y1="${top-6}" y2="${H-8}" stroke="var(--fg)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  el.style.position='relative';
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Predicted closing rank by college">${g}</svg><div class="ptip" hidden></div>`;
  const tip=el.querySelector('.ptip'),line=(k,v)=>`<div class="r"><span>${k}</span><b>${v}</b></div>`;
  el.querySelectorAll('g.row').forEach(n=>{
    const show=ev=>{const r=rows[+n.dataset.i],v=verdict(r,s.rank);
      tip.innerHTML=`<div class="h">${esc(r.college)} · ${r.cat} seats</div>`+line('Est. final close',fmt(r.pf))+line('Est. Round 1 close',fmt(r.p1))+line('Jan 2025',fmt(r.j25))+line('Jan 2026',fmt(r.j26))+line('Jul 2026',fmt(r.j27))+line('Round 1 seats (max)',fmt(r.seats))+line('Confidence',r.conf)+(v?line('Your chance',v[0]):'');
      tip.hidden=false;const b=el.getBoundingClientRect(),px=ev.clientX-b.left,py=ev.clientY-b.top,tw=tip.offsetWidth,th=tip.offsetHeight;
      tip.style.left=(px+14+tw>b.width?Math.max(0,px-tw-14):px+14)+'px';tip.style.top=Math.max(0,Math.min(py+12,b.height-th))+'px';
      n.querySelector('.hit').setAttribute('fill','var(--bg)')};
    n.addEventListener('pointerenter',show);n.addEventListener('pointermove',show);
    n.addEventListener('pointerleave',()=>{tip.hidden=true;n.querySelector('.hit').setAttribute('fill','transparent')});
  });
}
function niceStep(v){const p=Math.pow(10,Math.floor(Math.log10(v))),m=v/p;return (m<=1?1:m<=2?2:m<=5?5:10)*p}
function qual(s){
  const L=P.rl&&P.rl[P.brs[s.b].startsWith('MDS')?'MDS':'MD'];
  if(!L){$('p-qual').innerHTML='';$('p-pos').textContent='';return}
  const cs=Object.keys(L).sort((a,b)=>L[b].n-L[a].n),max=Math.max(...cs.map(c=>L[c].n));
  $('p-qual').innerHTML=cs.map(c=>`<div class="qrow${c===s.cat?' on':''}"><span>${c}</span><span><div class="qbar" style="width:${L[c].n/max*100}%"></div></span><span>${fmt(L[c].n)}</span></div>`).join('');
  if(!s.rank){$('p-pos').textContent='Enter your rank above to see where you stand within your category.';return}
  const pts=L[s.cat].pts;let pos;
  if(s.rank<=pts[0][1])pos=1;else if(s.rank>=pts[pts.length-1][1])pos=pts[pts.length-1][0];
  else{let i=pts.findIndex(p=>p[1]>s.rank);const a=pts[i-1],b=pts[i];pos=Math.round(a[0]+(b[0]-a[0])*(s.rank-a[1])/Math.max(1,b[1]-a[1]))}
  const n=pos%100,sf=n>=11&&n<=13?'th':({1:'st',2:'nd',3:'rd'}[pos%10]||'th');
  $('p-pos').innerHTML=`Rank ${fmt(s.rank)} is about the <span class="big">${fmt(pos)}${sf}</span> ${s.cat} candidate on this year's list, out of ${fmt(L[s.cat].n)}.`;
}
['p-branch','p-cat','p-rank'].forEach(id=>$(id).addEventListener('input',render));
let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(render,150)});
function setTheme(t,save){if(t)document.documentElement.setAttribute('data-theme',t);else document.documentElement.removeAttribute('data-theme');
  document.querySelectorAll('.theme button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.t===t));if(save){try{localStorage.setItem('theme',t)}catch(e){}}}
document.querySelectorAll('.theme button').forEach(x=>x.addEventListener('click',()=>setTheme(x.dataset.t,true)));
(function(){let t=null;try{t=localStorage.getItem('theme')}catch(e){}setTheme(t||'',false)})();
render();
})();
