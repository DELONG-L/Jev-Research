'use strict';
const DATA=JSON.parse(document.getElementById('research-data').textContent);
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const META={
 'Jev-1.13.0':{label:'Jev',detail:'1.13.0 · hosted',color:'#ffc36d'},
 'SemIf-Qwen3.5-4B':{label:'SemIf',detail:'Qwen3.5-4B · self-hosted',color:'#82c6ff'},
 'AnyJev-L0':{label:'AnyJev-L0',detail:'self-hosted',color:'#6ba7e2'},
 'Laya':{label:'Laya',detail:'self-hosted',color:'#80d9b5'},
 'Qwen3.5-4B-JSON':{label:'Qwen3.5 JSON',detail:'4B · self-hosted reference',color:'#aec1cf'},
 'DeepSeek-V4.1-Flash':{label:'DeepSeek',detail:'V4.1-Flash · hosted',color:'#b8a6ec'},
 'GLM-5.3-Flash':{label:'GLM',detail:'5.3-Flash · hosted',color:'#eea6c6'},
 'Qwen3.8-Flash':{label:'Qwen3.8',detail:'Flash · hosted',color:'#e1e7ef'}
};
const RAN_MODELS=DATA.ran.budget.series.map(s=>s.key);
const pct=(x,d=1)=>(x*100).toFixed(d)+'%';
const seconds=x=>x===null?'—':x<1?(x*1000<10?(x*1000).toFixed(1):Math.round(x*1000))+' ms':x.toFixed(x<10?2:1)+' s';
const modelName=k=>`<div class="model-label" style="--model:${META[k].color}">${META[k].label}<small>${META[k].detail}</small></div>`;
const button=(label,active,attr)=>`<button ${attr} aria-pressed="${active}">${label}</button>`;
const tableHead=(cls,labels)=>`<div class="table-head ${cls}" aria-hidden="true">${labels.map(s=>'<span>'+s+'</span>').join('')}</div>`;
function metric(label,value,note='',bar=null,color='var(--amber)'){
 return `<div class="metric" role="group" aria-label="${esc(label)}"><span class="metric-label">${label}</span><span class="number">${value}</span>${note?'<small class="subtext">'+note+'</small>':''}${bar===null?'':`<div class="micro-track" aria-hidden="true"><span style="width:${Math.max(0,Math.min(100,bar))}%;background:${color}"></span></div>`}</div>`;
}
function activateTab(tab){
 const group=tab.closest('[role=tablist]');
 group.querySelectorAll('[role=tab]').forEach(b=>{const active=b===tab;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;if(b.dataset.view)document.getElementById(b.dataset.view).hidden=!active;});
 if(tab.dataset.edgeMode){edge.mode=tab.dataset.edgeMode;$('#edge-panel').setAttribute('aria-labelledby',tab.id);renderEdge();}
}
$$('[role=tablist]').forEach(group=>{
 group.addEventListener('click',e=>{const b=e.target.closest('[role=tab]');if(b)activateTab(b);});
 group.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const tabs=Array.from(group.querySelectorAll('[role=tab]'));let i=tabs.indexOf(document.activeElement);if(i<0)return;e.preventDefault();i=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;activateTab(tabs[i]);tabs[i].focus();});
});

// All radio outcomes stay visible for the selected measured condition.
let radioPoint=4,telemetry='Fresh';
$('#radio-condition').innerHTML=DATA.ran.radio.points.map((p,i)=>`<option value="${i}" ${i===4?'selected':''}>${i===4?'Base · ':''}${p.rate} intents/s · ${p.speed} km/h</option>`).join('');
function renderRadio(){
 const p=DATA.ran.radio.points[radioPoint];
 $('#radio-kpis').innerHTML=tableHead('radio-row',['Interpreter','Affected violations ↓','Network violations ↓','Cell-edge p5 ↑','Packet p95 ↓'])+RAN_MODELS.map(k=>{
  const m=p.models[k],ci=name=>m[name+'_ci']?'95% CI '+m[name+'_ci'].map(x=>x.toFixed(2)).join('–'):'Point estimate';
  return `<div class="metric-row radio-row">${modelName(k)}${metric('Affected violations ↓',m.affected.toFixed(2)+'%',ci('affected'),m.affected,META[k].color)}${metric('Network violations ↓',m.network.toFixed(2)+'%',ci('network'),m.network,META[k].color)}${metric('Cell-edge p5 ↑',m.throughput.toFixed(3),'Mb/s per UE')}${metric('Packet p95 ↓',m.packet_p95.toFixed(1),'ms')}</div>`;
 }).join('');
 $('#radio-extra').innerHTML=tableHead('extra-row',['Interpreter','Handover rate','HO interruption','Link failures','Stale exposure'])+RAN_MODELS.map(k=>{
  const m=p.models[k];return `<div class="metric-row extra-row">${modelName(k)}${metric('Handover rate',m.handover_rate.toFixed(3),'per UE / min')}${metric('HO interruption',m.handover_p95.toFixed(1),'p95 · ms')}${metric('Link failures',m.rlf.toLocaleString('en-US'),'count / run')}${metric('Stale exposure',m.stale_exposure.toFixed(2),'UE·s / intent')}</div>`;
 }).join('');
 renderRadioMap();
 $('#radio-insight').innerHTML=radioPoint===4?'<strong>Keep the KPI scope visible.</strong><p>No hosted LLM shows a resolved affected-class SLA increase over Jev under both block lengths. Network-wide, GLM has 2.66 pp lower violation than Jev, resolved under both. These findings do not establish a general radio ranking from interpreter speed.</p>':'<strong>Mobility changes the operating conditions.</strong><p>These are descriptive points at the selected intent rate and UE speed. Only three mobility-grid points met the eligibility rules for the H2 test, below its five-point threshold. Read throughput, delay and SLA together.</p>';
}
$('#radio-condition').addEventListener('change',e=>{radioPoint=Number(e.target.value);renderRadio();});
function renderQuality(){
 $('#quality-options').innerHTML=Object.keys(DATA.ran.quality).map(q=>button(q==='Contradictory'?'Conflicting':q,q===telemetry,`data-quality="${q}"`)).join('');
 const rows=DATA.ran.quality[telemetry];
 $('#quality-rows').innerHTML=tableHead('quality-row',['Interpreter','Full policy correct ↑','Within 1 s ↑','Decision p95'])+RAN_MODELS.map(k=>{
  const m=rows.find(x=>x.key===k);return `<div class="metric-row quality-row">${modelName(k)}${metric('Policy correct ↑',pct(m.correct),'',m.correct*100,META[k].color)}${metric('Within 1 s ↑',pct(m.timely),'',m.timely*100,META[k].color)}${metric('Decision p95',seconds(m.p95))}</div>`;
 }).join('');
 const ref=rows.find(r=>r.key==='Qwen3.5-4B-JSON'),best=rows.reduce((a,b)=>a.correct>b.correct?a:b);
 $('#quality-insight').innerHTML=`<strong>Timing fit is only one admission condition.</strong><p>With ${telemetry.toLowerCase()} telemetry, Qwen JSON is within 1 s for ${pct(ref.timely)} of calls, while ${pct(ref.correct)} produce the complete correct policy. The highest observed full-policy correctness here is ${META[best.key].label} at ${pct(best.correct)}.</p>`;
}
$('#quality-options').addEventListener('click',e=>{const b=e.target.closest('[data-quality]');if(b){telemetry=b.dataset.quality;renderQuality();$('#quality-options [data-quality="'+telemetry+'"]').focus();}});

// One shared chart scale exposes the entire sweep before any interaction.
function trendChart(selector,keys,series,selected,axisLabel,scale='linear',labels=keys){
 const mobile=matchMedia('(max-width:560px)').matches;
 const width=mobile?Math.max(240,$(selector).getBoundingClientRect().width||innerWidth-70):900,height=mobile?258:300;
 const l=mobile?40:55,r=width-(mobile?12:25),t=22,b=mobile?190:231;
 $(selector).setAttribute('viewBox',`0 0 ${width} ${height}`);
 const coordinates=keys.map((k,i)=>scale==='category'?i:scale==='log'?Math.log(Number(k)):Number(k));
 const lo=Math.min(...coordinates),hi=Math.max(...coordinates);
 const xp=i=>l+(coordinates[i]-lo)/(hi-lo||1)*(r-l),yp=v=>b-v*(b-t);
 let svg='';
 [0,.25,.5,.75,1].forEach(v=>{svg+=`<line x1="${l}" x2="${r}" y1="${yp(v)}" y2="${yp(v)}" stroke="#2a4054"/><text x="${l-10}" y="${yp(v)+4}" fill="#9cafc0" font-size="11" text-anchor="end">${v*100}%</text>`;});
 const index=keys.indexOf(String(selected));
 if(index>=0)svg+=`<line x1="${xp(index)}" x2="${xp(index)}" y1="${t}" y2="${b}" stroke="#ffc36d" stroke-dasharray="4 4" opacity=".65"/>`;
 keys.forEach((k,i)=>{svg+=`<text x="${xp(i)}" y="${b+23}" fill="${k===String(selected)?'#ffc36d':'#9cafc0'}" font-size="12" text-anchor="${i===0?'start':i===keys.length-1?'end':'middle'}">${esc(labels[i])}</text>`;});
 series.forEach((s,j)=>{
  const d=s.values.map((v,i)=>`${i?'L':'M'}${xp(i).toFixed(1)},${yp(v).toFixed(1)}`).join(' '),color=META[s.key].color;
  svg+=`<path d="${d}" fill="none" stroke="${color}" stroke-width="${s.key==='Jev-1.13.0'?3:1.7}" ${j>3?'stroke-dasharray="'+(j+1)+' 3"':''}/>`;
  s.values.forEach((v,i)=>{svg+=`<circle cx="${xp(i)}" cy="${yp(v)}" r="${i===index?4.5:2.8}" fill="${color}" stroke="#101d2b" stroke-width="1"><title>${esc(META[s.key].label)} · ${esc(labels[i])}: ${pct(v)}</title></circle>`;});
 });
 const axisParts=axisLabel.split(' · ');
 svg+=mobile?`<text x="${width/2}" y="238" text-anchor="middle" fill="#a9bac9" font-size="11"><tspan x="${width/2}">${esc(axisParts[0])}</tspan><tspan x="${width/2}" dy="16">${esc(axisParts.slice(1).join(' · ').replace('logarithmic','log'))}</tspan></text>`:`<text x="${(l+r)/2}" y="285" text-anchor="middle" fill="#a9bac9" font-size="12">${esc(axisLabel)}</text>`;
 $(selector).innerHTML=`<title>${esc(axisLabel)}: completion percentages at every measured point</title><desc>All seven models are shown. Use the condition controls for exact completion and latency values. Selected condition: ${esc(selected)}.</desc><g font-family="PlexMono,monospace">${svg}</g>`;
 return e=>{const rect=e.currentTarget.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*width;return keys.reduce((closest,k,i)=>Math.abs(xp(i)-x)<Math.abs(xp(keys.indexOf(closest))-x)?k:closest,keys[0]);};
}
function legend(selector,keys){$(selector).innerHTML=keys.map(k=>`<span style="--model:${META[k].color}"><i aria-hidden="true"></i>${META[k].label}</span>`).join('');}
let ranRate='2';
function renderLoad(){
 const rates=DATA.ran.load.rates,models=DATA.ran.load.models;
 const pick=trendChart('#ran-load-chart',rates,models.map(m=>({key:m.key,values:rates.map(r=>m.cells[r].within)})),ranRate,'Offered intent rate · intents/s');
 $('#ran-load-chart').onpointerdown=e=>{ranRate=pick(e);renderLoad();};
 legend('#ran-load-legend',models.map(m=>m.key));
 $('#ran-rates').innerHTML=rates.map(r=>button(r+' intents/s',r===ranRate,`data-rate="${r}"`)).join('');
 $('#ran-load-rows').innerHTML=tableHead('load-row',['Interpreter','Within 1 s ↑','Queue p95','Slot utilization η'])+models.map(m=>{
  const c=m.cells[ranRate];return `<div class="metric-row load-row">${modelName(m.key)}${metric('Within 1 s ↑',pct(c.within),'',c.within*100,META[m.key].color)}${metric('Queue p95',seconds(c.q95))}${metric('Utilization η',c.rho.toFixed(2),c.ns?'<span class="status">Non-stationary</span>':'4 slots')}</div>`;
 }).join('');
}
$('#ran-rates').addEventListener('click',e=>{const b=e.target.closest('[data-rate]');if(b){ranRate=b.dataset.rate;renderLoad();$('#ran-rates [data-rate="'+ranRate+'"]').focus();}});
function renderPath(){
 const max=2500;
 $('#ran-path-rows').innerHTML=DATA.ran.path.map(m=>{
  const k=DATA.ran.kpm[m.key];
  return `<div class="path-row">${modelName(m.key)}<div class="path-bar"><div class="path-stack" aria-label="Stack of stage medians"><span class="decision" style="width:${m.dec/max*100}%"></span><span class="a1" style="width:${m.a1/max*100}%"></span><span class="e2" style="width:${m.e2/max*100}%"></span></div><div class="path-scale"><span>0</span><span>2,500 ms</span></div></div>${metric('Interpretation',Math.round(m.dec)+' ms',pct(m.dec/(m.dec+m.a1+m.e2))+' of stack')}${metric('A1 delivery',m.a1.toFixed(1)+' ms')}${metric('E2 ACK',m.e2.toFixed(1)+' ms')}<div class="metric kpm"><span class="metric-label">KPM upper p50</span><span class="number">${k.p50.toFixed(3)} s</span><small class="subtext">p95 ${k.p95.toFixed(3)} s</small></div></div>`;
 }).join('');
}

let budgetK=40,previewK=null;
const visibleModels=new Set(RAN_MODELS);
const chart={width:760,left:57,right:735,top:40,bottom:279};
const xBudget=k=>chart.left+k/60*(chart.right-chart.left),yMiss=p=>chart.bottom-p*(chart.bottom-chart.top);
function renderBudget(){
 const mobile=matchMedia('(max-width:560px)').matches,width=mobile?Math.max(240,$('#budget-chart').getBoundingClientRect().width||innerWidth-70):760;
 Object.assign(chart,{width,left:mobile?38:57,right:width-(mobile?10:25),top:40,bottom:279});
 $('#budget-chart').setAttribute('viewBox',`0 0 ${width} 350`);
 const k=previewK===null?budgetK:previewK,{left:l,right:r,top:t,bottom:b}=chart,boundary=xBudget(40);
 let svg=`<rect x="${l}" y="${t}" width="${boundary-l}" height="${b-t}" fill="#142b3f"/><rect x="${boundary}" y="${t}" width="${r-boundary}" height="${b-t}" fill="#172333"/><text x="${(l+boundary)/2}" y="24" fill="#a9c2d6" font-size="11" text-anchor="middle">${mobile?'near-RT ≤1 s':'near-RT · 10 ms–1 s'}</text><text x="${(boundary+r)/2}" y="24" fill="#a9c2d6" font-size="11" text-anchor="middle">${mobile?'non-RT >1 s':'non-RT · above 1 s'}</text>`;
 svg+=`<line x1="${l}" x2="${r}" y1="${yMiss(1-sloTarget/100)}" y2="${yMiss(1-sloTarget/100)}" stroke="#80d9b5" stroke-dasharray="6 4"/><text x="${r-5}" y="${Math.max(t+13,yMiss(1-sloTarget/100)-7)}" fill="#80d9b5" text-anchor="end" font-size="10">${sloTarget}% on time</text>`;
 [0,.25,.5,.75,1].forEach(p=>{const y=yMiss(p);svg+=`<line x1="${l}" x2="${r}" y1="${y}" y2="${y}" stroke="#2a4054"/><text x="${l-10}" y="${y+4}" fill="#a9bac9" font-size="10" text-anchor="end">${p*100}%</text>`;});
 [0,20,40,60].forEach((n,i)=>{const x=xBudget(n);svg+=`<line x1="${x}" x2="${x}" y1="${t}" y2="${b}" stroke="#2a4054" stroke-dasharray="3 4"/><text x="${x}" y="${b+23}" fill="#a9bac9" font-size="11" text-anchor="${i===0?'start':i===3?'end':'middle'}">${['10 ms','100 ms','1 s','10 s'][i]}</text>`;});
 DATA.ran.budget.series.forEach(s=>{if(!visibleModels.has(s.key))return;const d=s.miss.map((p,n)=>`${n?'L':'M'}${xBudget(n).toFixed(1)},${yMiss(p).toFixed(1)}`).join(' ');svg+=`<path d="${d}" fill="none" stroke="${META[s.key].color}" stroke-width="${s.key==='Jev-1.13.0'?3:1.7}" ${s.dash?`stroke-dasharray="${s.dash}"`:''}/>`;});
 svg+=`<line x1="${xBudget(k)}" x2="${xBudget(k)}" y1="${t}" y2="${b}" stroke="#ffc36d" stroke-width="1.3" ${previewK===null?'':'stroke-dasharray="4 3"'}/>`;
 DATA.ran.budget.series.forEach(s=>{if(visibleModels.has(s.key))svg+=`<circle cx="${xBudget(k)}" cy="${yMiss(s.miss[k])}" r="3" fill="${META[s.key].color}" stroke="#101d2b"/>`;});
 if(!visibleModels.size)svg+=`<text x="${(l+r)/2}" y="150" text-anchor="middle" fill="#e5edf4" font-size="13">${mobile?'All curves hidden':'All curves hidden · choose “Show all” to restore'}</text>`;
 svg+=`<text x="${(l+r)/2}" y="337" fill="#a9bac9" font-size="11" text-anchor="middle">Timing budget τ · logarithmic scale</text>`;
 $('#budget-chart').innerHTML=`<title id="budget-chart-title">Deadline miss fractions at ${seconds(DATA.ran.budget.grid[k])}</title><desc id="budget-chart-desc">Exact miss fractions appear beside the plot. Near-RT spans 10 ms to 1 s; non-RT starts above 1 s.</desc><g font-family="PlexMono,monospace">${svg}</g>`;
 $('#budget-value').textContent=seconds(DATA.ran.budget.grid[k]);$('#budget-loop').textContent=(previewK===null?'Selected · ':'Preview · ')+(k<=40?'near-RT reference':'non-RT reference');
 $('#budget-slider').value=budgetK;$('#budget-slider').setAttribute('aria-valuetext',seconds(DATA.ran.budget.grid[budgetK]));
 $$('[data-budget]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.budget)===budgetK));
 $('#budget-readouts').innerHTML=DATA.ran.budget.series.map(s=>{const p=s.miss[k],m=META[s.key];return `<button class="model-toggle" data-model="${esc(s.key)}" aria-label="${esc(s.key)}: ${pct(p,p<.01?2:1)} misses; toggle curve" aria-pressed="${visibleModels.has(s.key)}"><span class="swatch" style="background:${m.color}"></span><span class="label">${m.label}<small>${m.detail}</small></span><span class="value">${pct(p,p<.01?2:1)}</span></button>`;}).join('');
 renderSlo(k);
}
function setBudget(k){budgetK=Math.max(0,Math.min(60,k));previewK=null;renderBudget();}
$('#budget-slider').addEventListener('input',e=>setBudget(Number(e.target.value)));
$$('[data-budget]').forEach(b=>b.addEventListener('click',()=>setBudget(Number(b.dataset.budget))));
$('#budget-readouts').addEventListener('click',e=>{const b=e.target.closest('[data-model]');if(!b)return;const k=b.dataset.model;visibleModels.has(k)?visibleModels.delete(k):visibleModels.add(k);renderBudget();$('#budget-readouts [data-model="'+k+'"]').focus();});
$('#budget-reset').addEventListener('click',()=>{RAN_MODELS.forEach(k=>visibleModels.add(k));renderBudget();});
function budgetFromPointer(e){const rect=e.currentTarget.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*chart.width;return Math.max(0,Math.min(60,Math.round((x-chart.left)/(chart.right-chart.left)*60)));}
$('#budget-chart').addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const k=budgetFromPointer(e);if(previewK!==k){previewK=k;renderBudget();}});
$('#budget-chart').addEventListener('pointerleave',()=>{if(previewK!==null){previewK=null;renderBudget();}});
$('#budget-chart').addEventListener('pointerdown',e=>setBudget(budgetFromPointer(e)));

const edge={mode:'admission',scenario:'load',load:'4',deadline:'2',text:'repeated',cache:'off',arrivals:'steady'};
function renderEdge(){
 const ocr=edge.mode==='ocr',scenario=ocr?'cache':edge.scenario;
 $('#edge-scenario-label').textContent=ocr?'OCR arrival pattern':'Measured sweep';
 $('#edge-scenarios').innerHTML=(ocr?['steady','bursty']:['load','deadline','cache']).map(s=>button(({steady:'Steady',bursty:'Bursty',load:'Arrival load',deadline:'Deadline',cache:'Cache reuse'})[s],ocr?s===edge.arrivals:s===scenario,`data-edge-scenario="${s}"`)).join('');
 let row,keys,series,selected,labels,settings,context,axis,scale='log';
 if(scenario==='load'){
  keys=Object.keys(DATA.edge.load);selected=edge.load;row=DATA.edge.load[selected];
  settings=`<div><div class="control-label">Inspect request rate</div><div class="pills">${keys.map(v=>button(v+' req/s',v===selected,`data-edge-value="${v}"`)).join('')}</div></div>`;
  context='Live admission + modeled execution · 4 interpretation slots · 2 s deadline · 5 nodes · changing descriptions · cache off';
  series=DATA.edge.models.map((key,i)=>({key,values:keys.map(v=>DATA.edge.load[v].completion[i])}));axis='Offered request rate · req/s · logarithmic scale';
 }
 if(scenario==='deadline'){
  keys=['0.5','1','2','4'];selected=edge.deadline;row=DATA.edge.deadline[selected];
  settings=`<div><div class="control-label">Inspect request deadline</div><div class="pills">${keys.map(v=>button(v+' s',v===selected,`data-edge-value="${v}"`)).join('')}</div></div>`;
  context='Live admission + modeled execution · 4 requests/s · 4 interpretation slots · 5 nodes · changing descriptions · cache off';
  series=DATA.edge.models.map((key,i)=>({key,values:keys.map(v=>DATA.edge.deadline[v].completion[i])}));axis='Request deadline · seconds · logarithmic scale';
 }
 if(scenario==='cache'){
  settings=`<label>Descriptions<select id="edge-text" aria-label="Description reuse"><option value="changing" ${edge.text==='changing'?'selected':''}>Changing</option><option value="repeated" ${edge.text==='repeated'?'selected':''}>Recurring</option></select></label><label>Semantic cache<select id="edge-cache" aria-label="Semantic cache"><option value="off" ${edge.cache==='off'?'selected':''}>Off</option><option value="on" ${edge.cache==='on'?'selected':''}>On</option></select></label>`;
  const key=edge.text+', '+edge.cache;row=ocr?DATA.edge.ocr[edge.arrivals][key]:DATA.edge.cache[key];
  context=ocr?`Executed OCR service · ${edge.arrivals} arrivals · 2 s deadline · ${edge.text==='repeated'?'recurring':'changing'} descriptions · cache ${edge.cache}`:`Live admission + modeled execution · 4 req/s · 4 interpretation slots · 2 s deadline · 5 nodes · ${edge.text==='repeated'?'recurring':'changing'} descriptions`;
  keys=['off','on'];labels=['Cache off','Cache on'];selected=edge.cache;scale='category';
  series=DATA.edge.models.map((key,i)=>({key,values:keys.map(v=>DATA.edge.cache[edge.text+', '+v].completion[i])}));axis='Matched reuse conditions · separate live runs';
 }
 $('#edge-settings').dataset.kind=scenario;
 $('#edge-settings').innerHTML=settings;$('#edge-context').textContent=context;
 $('#edge-trend-wrap').hidden=ocr;
 if(!ocr){
  $('#edge-trend-caption').textContent='Correct, on-time completion · all measured '+(scenario==='load'?'arrival rates':scenario==='deadline'?'deadlines':'cache conditions');
  const pick=trendChart('#edge-trend-chart',keys,series,selected,axis,scale,labels||keys);
  $('#edge-trend-chart').onpointerdown=e=>{edge[scenario==='load'?'load':scenario==='deadline'?'deadline':'cache']=pick(e);renderEdge();};
  legend('#edge-trend-legend',DATA.edge.models);
 }
 $('#ocr-reference').hidden=!ocr;
 if(ocr){
  const r=DATA.edge.ocr_reference,n=r.recognizer_correct[edge.text];
  $('#ocr-reference').innerHTML=`<div><span class="eyebrow">Jev · compliant and on time</span><b>${r.jev_compliant_timely} / ${r.supported}</b><p>Supported OCR requests executed within the required constraints and deadline.</p></div><div><span class="eyebrow">Jev · exact OCR output</span><b>${n} / ${r.supported}</b><p>Matches Tesseract's own accuracy on these images: ${pct(n/r.supported)}.</p></div><div><span class="eyebrow">Jev · correct rejection</span><b>${r.jev_correct_rejections} / ${r.unsupported}</b><p>Unsupported counting and detection requests rejected.</p></div><p>All ${r.supported+r.unsupported} arrivals remain accounted for. The correct OCR completion denominator is the ${r.supported} supported OCR requests; the ${r.unsupported} unsupported requests are reported separately.</p>`;
 }
 $('#edge-chart-heading').textContent=ocr?'Correct OCR output within deadline':'Full-intent, correct and on-time service';
 $('#edge-sample').textContent=row.supported+' supported requests';
 $('#edge-rows').innerHTML=tableHead('completion-row',['Interpreter','Correct & on time ↑','Correct / supported','Request p95'])+DATA.edge.models.map((key,i)=>`<div class="metric-row completion-row">${modelName(key)}${metric('Correct & on time ↑',pct(row.completion[i]),'',row.completion[i]*100,META[key].color)}${metric('Correct / supported',row.correct_count[i]+' / '+row.supported)}${metric('Request p95',seconds(row.latency[i]),row.latency[i]===null?'No completions':'Own completions')}</div>`).join('');
 let insight;
 if(ocr){
  insight=`<strong>The service output sets a separate limit.</strong><p>Jev executes every supported OCR request compliantly and on time in this condition. Its ${pct(row.completion[0])} correct OCR completion is bounded by recognition accuracy. `;
  insight+=edge.text==='changing'?'Changing descriptions provide no recurring intent to reuse; differences between cache-off and cache-on runs also reflect provider variation.':edge.cache==='on'?`With recurring descriptions cached, Jev and the three hosted LLMs each reach ${pct(row.completion[0])}; Laya remains at ${pct(row.completion[2])}. Cache reuse can preserve an incorrect decision.`:'With the semantic cache off, recurring descriptions still require fresh interpretation. Inspect cache on to see the reuse boundary.';
  insight+='</p>';
 }else if(scenario==='load'){
  insight=`<strong>Read the complete load range.</strong><p>At ${edge.load} req/s, Jev completes ${pct(row.completion[0])} correctly and on time; DeepSeek completes ${pct(row.completion[3])}. At 4 req/s DeepSeek has higher exact completion. At 16 req/s all three hosted LLMs are below 10%, while Jev remains at 90.7%. These are finite measured runs.</p>`;
 }else if(scenario==='deadline'){
  insight=`<strong>The deadline covers the whole service request.</strong><p>At ${edge.deadline} s, Jev reaches ${pct(row.completion[0])}, DeepSeek ${pct(row.completion[3])} and GLM ${pct(row.completion[4])} correct, on-time completion. Admission waiting, interpretation, service queueing, transfer and execution all consume this budget.</p>`;
 }else if(edge.text==='changing'){
  insight='<strong>Changing descriptions offer no recurring intent to reuse.</strong><p>Cache on and off are separate live runs under the same cache policy for all interpreters. Provider latency can vary; differences here do not establish a benefit from cache hits.</p>';
 }else if(edge.cache==='off'){
  insight='<strong>Repeated input still costs a fresh decision with caching off.</strong><p>The plot shows both measured cache conditions. Inspect cache on to see which completion gaps shrink and which incorrect decisions persist.</p>';
 }else{
  const rates=[0,3,4,5].map(i=>row.completion[i]);
  insight=`<strong>Reuse narrows the hosted-model gap.</strong><p>With recurring descriptions cached, Jev and the three hosted LLMs reach ${pct(Math.min(...rates))}–${pct(Math.max(...rates))} completion. Laya remains at ${pct(row.completion[2])}, and Qwen JSON at ${pct(row.completion[6])}. A cache can also repeat an incorrect decision.</p>`;
 }
 $('#edge-insight').innerHTML=insight;
 renderEdgeCompare();
}
$('#edge-scenarios').addEventListener('click',e=>{const b=e.target.closest('[data-edge-scenario]');if(!b)return;const value=b.dataset.edgeScenario;if(edge.mode==='ocr')edge.arrivals=value;else edge.scenario=value;renderEdge();$('#edge-scenarios [data-edge-scenario="'+value+'"]').focus();});
$('#edge-settings').addEventListener('click',e=>{const b=e.target.closest('[data-edge-value]');if(!b)return;const field=edge.scenario==='deadline'?'deadline':'load';edge[field]=b.dataset.edgeValue;renderEdge();$('#edge-settings [data-edge-value="'+edge[field]+'"]').focus();});
$('#edge-settings').addEventListener('change',e=>{if(e.target.id==='edge-text')edge.text=e.target.value;if(e.target.id==='edge-cache')edge.cache=e.target.value;const id=e.target.id;renderEdge();$('#'+id).focus();});

const verification={domain:'transport',delay:'0.5',rate:'4.992'};
function renderVerification(){
 const {domain,delay,rate}=verification,data=DATA.sok.verification[domain],sparse=data.sparse[delay],loaded=data.load[rate][delay],budget=domain==='transport'?10:2;
 $('#verification-delays').innerHTML=['0','0.1','0.5','2'].map(d=>button(d+' s',d===delay,`data-delay="${d}"`)).join('');
 $('#endpoint-evidence').innerHTML=[['Execution ACK',sparse.ack,sparse.decision_share_ack],['Verified outcome',sparse.outcome,sparse.decision_share_outcome]].map(([label,times,share])=>`<div class="endpoint-row"><span class="endpoint-name">${label}</span><span class="number">${seconds(times[0])}</span><span class="subtext">p50 elapsed time</span><span class="endpoint-tail">p95 ${seconds(times[1])}</span><span class="endpoint-share">Mean decision share: ${share.toFixed(1)}%</span><div class="micro-track" aria-hidden="true"><span style="width:${share}%"></span></div></div>`).join('');
 const card=(label,d,cls)=>`<div class="queue-outcome ${cls}"><span class="eyebrow">${label}</span><b>${d.attainment.toFixed(1)}%</b><small>within ${budget} s · all arrivals</small><small>95% CI ${d.attainment_ci[0].toFixed(1)}–${d.attainment_ci[1].toFixed(1)}%</small><p>Outcome p95 <strong>${seconds(d.outcome[1])}</strong></p><p>${d.verified.toLocaleString('en-US')} / ${d.n.toLocaleString('en-US')} eventually verified</p></div>`;
 $('#queue-evidence').innerHTML=`<div class="queue-comparison">${card('Isolated execution',sparse,'')}${card('Queue + replay',loaded,'loaded')}</div><div class="queue-util">${rate} arrivals/s · 1 decision slot · ρ ${loaded.rho.toFixed(3)}${loaded.rho>=1?' · non-stationary':''}</div>`;
 renderWalkthrough();
 $('#verification-insight').innerHTML=`<strong>${domain==='transport'?'Transport':'Edge'} · ${delay} s decision · ${budget} s outcome budget.</strong> Attainment changes from ${sparse.attainment.toFixed(1)}% in isolation to ${loaded.attainment.toFixed(1)}% with the selected queue. The loaded outcome p95 is ${seconds(loaded.outcome[1])}. The ${budget} s target is this experiment's task budget.`;
}
$('#verification-domain').addEventListener('change',e=>{verification.domain=e.target.value;renderVerification();});
$('#verification-rate').addEventListener('change',e=>{verification.rate=e.target.value;renderVerification();});
$('#verification-delays').addEventListener('click',e=>{const b=e.target.closest('[data-delay]');if(b){verification.delay=b.dataset.delay;renderVerification();$('#verification-delays [data-delay="'+verification.delay+'"]').focus();}});
const checkData=DATA.sok.checks;
['contract','route'].forEach((name,i)=>{const pair=checkData[i?'routes':'contracts'];$('#'+name+'-count').innerHTML=pair[0]+' <small>/ '+pair[1]+'</small>';$('#'+name+'-fill').style.width=pair[0]/pair[1]*100+'%';});
$('#gate-condition').innerHTML=checkData.gates.map((g,i)=>`<option value="${i}">${esc(g.condition.replace(' + fault-domain separation',' + separation'))}</option>`).join('');
function renderGate(){const d=checkData.gates[Number($('#gate-condition').value)];$('#gate-condition-detail').textContent=d.condition;$('#gate-condition-detail').hidden=!d.condition.includes('fault-domain');$('#gate-evidence').innerHTML=`<div class="gate-comparison"><div><small>Self-check</small><b>${d.self.join(' / ')}</b></div><span aria-hidden="true">→</span><div><small>Public-gate workflow</small><b>${d.gate.join(' / ')}</b></div></div><div class="gate-gain">+${d.gain[0].toFixed(1)} pp · 95% CI ${d.gain[1].toFixed(1)}–${d.gain[2].toFixed(1)}</div>`;}
$('#gate-condition').addEventListener('change',renderGate);

function renderCoverage(){
 $('#coverage-all').innerHTML=Object.entries(DATA.sok.groups).map(([group,labels])=>`<div class="coverage-group"><h4>${esc(group)}</h4>${labels.map(label=>{
  const d=DATA.sok.reporting[label],flag=DATA.sok.lower_agreement.includes(label);return `<div class="coverage-item"><span class="name">${esc(label)}${flag?'<span class="coding-flag">Lower coding agreement</span>':''}</span><b>${d.count}/139</b><div class="micro-track" aria-hidden="true"><span style="width:${d.count/139*100}%"></span></div><small>${(d.count/139*100).toFixed(1)}% · 95% family interval ${d.ci95_pct.join('–')}%</small></div>`;
 }).join('')}</div>`).join('');
}
let mapFilter='All',mapQuery='',mapPage=0;
function renderMap(){
 const filters={All:'All','S':'Selection','G':'Generation','C':'Computation','U':'Unspecified'};
 $('#map-filters').innerHTML=Object.entries(filters).map(([k,label])=>button(label,k===mapFilter,`data-interface="${k}"`)).join('');
 const query=mapQuery.trim().toLowerCase(),items=DATA.sok.families.filter(f=>(mapFilter==='All'||f.interfaces.includes(mapFilter))&&(!query||[f.title,f.workflow,f.path,JevLocale.translate(f.workflow)].join(' ').toLowerCase().includes(query)));
 const pageSize=5,pages=Math.max(1,Math.ceil(items.length/pageSize));mapPage=Math.min(mapPage,pages-1);const shown=items.slice(mapPage*pageSize,(mapPage+1)*pageSize);
 $('#map-count').textContent=items.length+' of 139 families'+(mapFilter==='All'?'':' · '+filters[mapFilter]+' interface');
 $('#family-list').innerHTML=shown.length?shown.map(f=>`<details class="family"><summary><span class="family-title"><span lang="en" data-no-i18n>${esc(f.title)}</span><small>${f.year?esc(f.year)+' · ':''}${esc(f.workflow)}</small></span><span class="interface-chips">${f.interfaces.map(i=>'<b>'+i+'</b>').join('')}<span class="expand" aria-hidden="true">+</span></span></summary><div class="family-body"><p class="source-language-note">Original evidence descriptions are retained in English for checking against the source literature.</p><p class="path" lang="en" data-no-i18n>${esc(f.path)}</p><div class="checks">${Object.entries(f.checks).map(([name,text])=>`<div class="${text==='NE'?'unresolved':''}"><strong>${name}</strong>${text==='NE'?'Unresolved':'<span lang="en" data-no-i18n>'+esc(text)+'</span>'}</div>`).join('')}</div><p class="family-note" lang="en" data-no-i18n>${esc(f.note)}</p>${f.url?`<a class="family-source" href="${esc(f.url)}" target="_blank" rel="noopener">Source work ↗</a>`:''}</div></details>`).join(''):'<p class="no-results">No families match this search. Try another title, task or interface.</p>';
 $('#map-page').textContent=shown.length?(mapPage*pageSize+1)+'–'+(mapPage*pageSize+shown.length)+' of '+items.length:'0 results';$('#map-prev').disabled=mapPage===0;$('#map-next').disabled=mapPage>=pages-1;
}
$('#map-filters').addEventListener('click',e=>{const b=e.target.closest('[data-interface]');if(b){mapFilter=b.dataset.interface;mapPage=0;renderMap();$('#map-filters [data-interface="'+mapFilter+'"]').focus();}});
$('#family-search').addEventListener('input',e=>{mapQuery=e.target.value;mapPage=0;renderMap();});
$('#map-prev').addEventListener('click',()=>{mapPage--;renderMap();});$('#map-next').addEventListener('click',()=>{mapPage++;renderMap();});
$('.data-view').addEventListener('toggle',e=>{if(e.target.open&&!$('#data-text').value)$('#data-text').value=JSON.stringify(DATA,null,2);});
// HTTP previews download a real static file; the standalone file retains an offline fallback.
if(location.protocol==='file:')$('#download-data').href=URL.createObjectURL(new Blob([JSON.stringify(DATA,null,2)],{type:'application/json'}));

let resizeFrame;
addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{renderBudget();renderLoad();renderEdge();});});
