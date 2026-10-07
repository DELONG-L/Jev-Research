// Linked views only use the existing, source-checked aggregate cells.
const RADIO_METRICS={
 affected:{label:'Affected SLA violations',unit:'%',delta:'pp',digits:2,better:-1},
 network:{label:'Network SLA violations',unit:'%',delta:'pp',digits:2,better:-1},
 throughput:{label:'Cell-edge p5 throughput',unit:'Mb/s',delta:'Mb/s',digits:3,better:1},
 packet_p95:{label:'Packet p95 delay',unit:'ms',delta:'ms',digits:1,better:-1}
};
let radioMetric='affected',radioMapMode='absolute',radioFocus='Jev-1.13.0';
const signed=(v,d=1)=>Math.abs(v)<.5*Math.pow(10,-d)?(0).toFixed(d):(v>0?'+':'−')+Math.abs(v).toFixed(d);
function renderRadioMap(){
 const points=DATA.ran.radio.points,base=points[4],spec=RADIO_METRICS[radioMetric],delta=radioMapMode==='delta';
 const val=(p,key)=>p.models[key][radioMetric]-(delta?base.models[key][radioMetric]:0);
 const values=points.flatMap(p=>RAN_MODELS.map(key=>val(p,key))),lo=Math.min(...values),hi=Math.max(...values),extent=Math.max(Math.abs(lo),Math.abs(hi))||1;
 $('#radio-map-scale').textContent=delta?`Blue = improvement · amber = deterioration · relative to 0.3 intents/s, 30 km/h for the same model.`:`Lighter = higher ${spec.label.toLowerCase()} · ${lo.toFixed(spec.digits)}–${hi.toFixed(spec.digits)} ${spec.unit} · ${spec.better>0?'higher':'lower'} is better.`;
 $('#radio-heatmap').innerHTML=`<caption class="sr-only">${spec.label}, ${delta?'change from base':'measured values'}. Rows are intent rate and UE speed; columns are interpreters.</caption><thead><tr><th scope="col">intents/s<br>km/h</th>${RAN_MODELS.map(key=>`<th scope="col" style="color:${META[key].color}">${META[key].label}</th>`).join('')}</tr></thead><tbody>${points.map((p,i)=>`<tr><th scope="row">${p.rate} · ${p.speed}${i===4?'<small>BASE</small>':''}</th>${RAN_MODELS.map((key,j)=>{
  const n=val(p,key),selected=i===radioPoint&&key===radioFocus;
  const rgb=delta?(n*spec.better>=0?'100,185,247':'246,167,87'):'100,185,247';
  const intensity=delta?Math.abs(n)/extent:(n-lo)/(hi-lo||1),label=(delta?signed(n,spec.digits):n.toFixed(spec.digits));
  return `<td><button data-radio-cell="${i}:${j}" aria-pressed="${selected}" tabindex="${selected?0:-1}" style="background:rgba(${rgb},${(.05+.4*intensity).toFixed(3)})" aria-label="${esc(META[key].label)}, ${p.rate} intents/s, ${p.speed} km/h: ${delta?'change ':''}${label} ${delta?spec.delta:spec.unit}">${label}</button></td>`;
 }).join('')}</tr>`).join('')}</tbody>`;
 const p=points[radioPoint],m=p.models[radioFocus],b=base.models[radioFocus];
 $('#radio-focus').innerHTML=`<div class="focus-title">${modelName(radioFocus)}<span>${p.rate} intents/s · ${p.speed} km/h${radioPoint===4?' · base condition':''}</span></div><div class="focus-metrics">${Object.entries(RADIO_METRICS).map(([key,sp])=>`<div><small>${sp.label}</small><b>${m[key].toFixed(sp.digits)} <span>${sp.unit}</span></b><p>${radioPoint===4?'Reference condition':signed(m[key]-b[key],sp.digits)+' '+sp.delta+' vs same-model base'}</p></div>`).join('')}</div><p class="note">These are descriptive, latency-only radio outcomes. A change across conditions is not a model-specific causal effect.</p>`;
 $('#radio-condition').value=radioPoint;
 $$('[data-map-mode]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.mapMode===radioMapMode));
}
$('#radio-map-metric').addEventListener('change',e=>{radioMetric=e.target.value;renderRadioMap();});
$$('[data-map-mode]').forEach(el=>el.addEventListener('click',()=>{radioMapMode=el.dataset.mapMode;renderRadioMap();}));
function selectRadioCell(i,j,focus=true){
 radioPoint=i;radioFocus=RAN_MODELS[j];renderRadio();
 if(focus)$('#radio-heatmap [data-radio-cell="'+i+':'+j+'"]').focus({preventScroll:true});
}
$('#radio-heatmap').addEventListener('click',e=>{const b=e.target.closest('[data-radio-cell]');if(b)selectRadioCell(...b.dataset.radioCell.split(':').map(Number));});
$('#radio-heatmap').addEventListener('keydown',e=>{
 const b=e.target.closest('[data-radio-cell]');if(!b||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
 e.preventDefault();let [i,j]=b.dataset.radioCell.split(':').map(Number);
 if(e.key==='ArrowLeft')j=Math.max(0,j-1);if(e.key==='ArrowRight')j=Math.min(6,j+1);
 if(e.key==='ArrowUp')i=Math.max(0,i-1);if(e.key==='ArrowDown')i=Math.min(9,i+1);
 if(e.key==='Home')j=0;if(e.key==='End')j=6;
 selectRadioCell(i,j);$('#radio-heatmap [data-radio-cell="'+i+':'+j+'"]').scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
});

let sloTarget=99;
function renderSlo(k){
 const pass=DATA.ran.budget.series.filter(s=>(1-s.miss[k])*100+1e-9>=sloTarget).length;
 $('#slo-summary').textContent=`${pass} of 7 models meet ${sloTarget}% at the ${previewK===null?'selected':'previewed'} budget of ${seconds(DATA.ran.budget.grid[k])}.`;
 $$('[data-slo]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.slo)===sloTarget));
 $('#slo-results').innerHTML=DATA.ran.budget.series.map(s=>{
  const first=s.miss.findIndex(v=>(1-v)*100+1e-9>=sloTarget),met=(1-s.miss[k])*100+1e-9>=sloTarget;
  return `<div class="slo-row">${modelName(s.key)}<div><b class="${met?'met':'unmet'}">${met?'Meets target':'Below target'}</b><small>${pct(1-s.miss[k],2)} at inspected τ</small></div><button data-slo-budget="${first}" ${first<0?'disabled':''} aria-label="${esc(META[s.key].label)}: ${first<0?'target not reached through 10 seconds':'inspect first qualifying sampled budget, approximately '+seconds(DATA.ran.budget.grid[first])}">${first<0?'Not reached ≤10 s':'≈ '+seconds(DATA.ran.budget.grid[first])+' ↗'}<small>${first<0?'Within tested range':'First sampled budget'}</small></button></div>`;
 }).join('');
}
function setSlo(value,syncInput=true){sloTarget=value;if(syncInput)$('#slo-target').value=value;$('#slo-error').textContent='';$('#slo-target').removeAttribute('aria-invalid');renderBudget();}
$('#slo-target').addEventListener('input',e=>{
 const v=e.target.valueAsNumber;
 if(!Number.isFinite(v)||v<50||v>100){$('#slo-error').textContent='Enter a target between 50% and 100%.';e.target.setAttribute('aria-invalid','true');return;}
 setSlo(v,false);
});
$$('[data-slo]').forEach(b=>b.addEventListener('click',()=>setSlo(Number(b.dataset.slo))));
$('#slo-results').addEventListener('click',e=>{
 const b=e.target.closest('[data-slo-budget]');if(!b||Number(b.dataset.sloBudget)<0)return;
 const row=Array.from($('#slo-results').children).indexOf(b.closest('.slo-row'));setBudget(Number(b.dataset.sloBudget));
 $('#slo-results').children[row].querySelector('button').focus({preventScroll:true});
});

const edgeBaselines={admission:{...edge,mode:'admission',scenario:'load',load:'1'},ocr:{...edge,mode:'ocr',arrivals:'steady'}};
let compareNotice='';
function edgeCell(state){
 if(state.mode==='ocr')return DATA.edge.ocr[state.arrivals][state.text+', '+state.cache];
 if(state.scenario==='load')return DATA.edge.load[state.load];
 if(state.scenario==='deadline')return DATA.edge.deadline[state.deadline];
 return DATA.edge.cache[state.text+', '+state.cache];
}
function edgeCondition(state){
 if(state.mode==='ocr')return {title:(state.arrivals==='steady'?'Steady':'Bursty')+' OCR arrivals',detail:`${state.text==='repeated'?'Recurring':'Changing'} descriptions · cache ${state.cache} · 2 s deadline · 180 supported requests`};
 const settings=state.scenario==='load'?`${state.load} req/s · 2 s deadline · changing · cache off`:state.scenario==='deadline'?`4 req/s · ${state.deadline} s deadline · changing · cache off`:`4 req/s · 2 s deadline · ${state.text==='repeated'?'recurring':'changing'} · cache ${state.cache}`;
 return {title:settings,detail:'Live admission + modeled execution · 4 slots · 300 supported requests'};
}
function renderEdgeCompare(){
 const a=edgeBaselines[edge.mode],b=edge,ra=edgeCell(a),rb=edgeCell(b),ca=edgeCondition(a),cb=edgeCondition(b);
 $('#compare-a').innerHTML=`<b>${ca.title}</b><small>${ca.detail}</small>`;$('#compare-b').innerHTML=`<b>${cb.title}</b><small>${cb.detail}</small>`;
 const presets=edge.mode==='ocr'?[['burst','Steady → bursty'],['reuse','Cache off → on']]:[['load','1 → 16 req/s'],['deadline','0.5 → 2 s deadline'],['reuse','Cache off → on']];
 $('#comparison-presets').innerHTML=presets.map(([key,label])=>`<button data-compare-preset="${key}">${label}</button>`).join('');
 $('#comparison-rows').innerHTML=DATA.edge.models.map((key,i)=>{
  const x=ra.completion[i]*100,y=rb.completion[i]*100,gain=y-x,col=META[key].color;
  return `<div class="compare-row" data-compare-model="${esc(key)}">${modelName(key)}<div class="dumbbell"><svg viewBox="0 0 320 34" role="img" aria-label="${esc(META[key].label)} correct on-time completion: A ${pct(ra.completion[i])}, B ${pct(rb.completion[i])}"><line x1="10" x2="310" y1="17" y2="17" stroke="#30465a"/>${[0,25,50,75,100].map(v=>`<line x1="${10+v*3}" x2="${10+v*3}" y1="12" y2="22" stroke="#30465a"/>`).join('')}<line x1="${10+x*3}" x2="${10+y*3}" y1="17" y2="17" stroke="${col}" stroke-width="3"/><circle cx="${10+x*3}" cy="17" r="6" fill="#132231" stroke="${col}" stroke-width="2"/><circle cx="${10+y*3}" cy="17" r="4" fill="${col}"/></svg><span class="pair-rates">${pct(ra.completion[i])} → ${pct(rb.completion[i])}</span><small>${ra.correct_count[i]}/${ra.supported} → ${rb.correct_count[i]}/${rb.supported} correct</small></div><div class="compare-delta"><b class="${gain>=0?'met':'unmet'}">${signed(gain)} pp</b><small>Completion change</small></div><div class="compare-latency"><b>${seconds(ra.latency[i])} → ${seconds(rb.latency[i])}</b><small>Request p95 · own completions</small></div></div>`;
 }).join('');
 $('#compare-status').textContent=compareNotice||(ca.title===cb.title&&ca.detail===cb.detail?'A and B currently match. Change a control above or select an example to reveal a difference.':'A stays fixed as you explore. The paired rows preserve both completion counts and latency.');
 compareNotice='';
}
$('#edge-pin').addEventListener('click',()=>{edgeBaselines[edge.mode]={...edge};compareNotice='Current B is now pinned as A. Change a condition above or choose an example.';renderEdgeCompare();});
$('#edge-swap').addEventListener('click',()=>{const a=edgeBaselines[edge.mode];edgeBaselines[edge.mode]={...edge};Object.assign(edge,a);compareNotice='A and B swapped. The upper controls now match B.';renderEdge();});
function setComparisonPreset(key){
 const a={...edge},b={...edge};
 if(key==='load'){a.scenario=b.scenario='load';a.load='1';b.load='16';}
 if(key==='deadline'){a.scenario=b.scenario='deadline';a.deadline='0.5';b.deadline='2';}
 if(key==='reuse'){a.scenario=b.scenario='cache';a.text=b.text='repeated';a.cache='off';b.cache='on';}
 if(key==='burst'){a.arrivals='steady';b.arrivals='bursty';}
 edgeBaselines[edge.mode]=a;Object.assign(edge,b);renderEdge();
}
$('#comparison-presets').addEventListener('click',e=>{const b=e.target.closest('[data-compare-preset]');if(b){setComparisonPreset(b.dataset.comparePreset);$('#comparison-presets [data-compare-preset="'+b.dataset.comparePreset+'"]').focus({preventScroll:true});}});

let walkStep=0,walkTimer=null;
const walkMotion=matchMedia('(prefers-reduced-motion:reduce)');
const WALK_LABELS=['Decision','Execution ACK','Verified outcome','Queue + replay'];
function stopWalk(){if(walkTimer!==null)clearInterval(walkTimer);walkTimer=null;$('#walk-play').textContent='Play guide';}
function renderWalkthrough(){
 const {domain,delay,rate}=verification,d=DATA.sok.verification[domain],s=d.sparse[delay],q=d.load[rate][delay],budget=domain==='transport'?10:2;
 const cards=[
  {value:seconds(Number(delay)),unit:'Controlled decision delay',title:'A fast decision is the first checkpoint.',text:'This is the nominal delay imposed on the fixed decision. It tells you neither when the action is acknowledged nor whether the intended service outcome has been verified.',facts:'Continue to the ACK to inspect the measured execution endpoint.'},
  {value:seconds(s.ack[0]),unit:'Execution ACK · p50',title:'The stack has acknowledged the action.',text:'The ACK closes the execution request. The verification work still follows. A timing claim that stops here has a different endpoint from a service-outcome claim.',facts:`ACK p95 ${seconds(s.ack[1])} · isolated arm · ${s.n} executions`},
  {value:seconds(s.outcome[0]),unit:'Verified outcome · p50',title:'Now measure whether the intended result is there.',text:`${s.attainment.toFixed(1)}% of isolated executions reach the verified outcome within the task's ${budget} s budget. The deadline is judged from arrival to verified outcome.`,facts:`Outcome p95 ${seconds(s.outcome[1])} · 95% attainment CI ${s.attainment_ci.map(v=>v.toFixed(1)).join('–')}% · ${s.verified}/${s.n} eventually verified`},
  {value:seconds(q.outcome[0]),unit:'Loaded verified outcome · p50',title:'Bring arriving work and waiting time back in.',text:`At ${rate} arrivals/s, ${q.attainment.toFixed(1)}% reach the verified outcome within ${budget} s. This arm uses the real FIFO decision queue and measured execution-time replay.`,facts:`Outcome p95 ${seconds(q.outcome[1])} · ρ ${q.rho.toFixed(3)}${q.rho>=1?' · non-stationary':''} · ${q.verified.toLocaleString('en-US')}/${q.n.toLocaleString('en-US')} eventually verified`}
 ];
 const c=cards[walkStep];
 $$('[data-walk]').forEach(b=>{b.setAttribute('aria-pressed',Number(b.dataset.walk)===walkStep);b.classList.toggle('passed',Number(b.dataset.walk)<walkStep);});
 $('#walk-slider').value=walkStep;$('#walk-slider').setAttribute('aria-valuetext',`Checkpoint ${walkStep+1}: ${WALK_LABELS[walkStep]}`);
 $('#walk-prev').disabled=walkStep===0;$('#walk-next').disabled=walkStep===3;
 $('#walk-result').innerHTML=`<div class="walk-reading"><small>${c.unit}</small><b>${c.value}</b><span>${domain==='transport'?'Transport':'Edge'} · ${delay} s decision</span></div><div class="walk-explanation"><span class="eyebrow">Checkpoint ${walkStep+1} / 4</span><h4>${c.title}</h4><p>${c.text}</p><small>${c.facts}</small></div>`;
 $('#walk-play').hidden=walkMotion.matches;$('#walk-play').disabled=walkMotion.matches;$('#walk-play').title=walkMotion.matches?'Use the checkpoint controls with reduced motion enabled.':'';
}
function setWalkStep(step){stopWalk();walkStep=Math.max(0,Math.min(3,step));renderWalkthrough();}
$$('[data-walk]').forEach(b=>b.addEventListener('click',()=>setWalkStep(Number(b.dataset.walk))));
$('#walk-slider').addEventListener('input',e=>setWalkStep(Number(e.target.value)));
$('#walk-prev').addEventListener('click',()=>setWalkStep(walkStep-1));$('#walk-next').addEventListener('click',()=>setWalkStep(walkStep+1));
$('#walk-play').addEventListener('click',()=>{
 if(walkTimer!==null){stopWalk();return;}if(walkMotion.matches)return;
 walkStep=0;renderWalkthrough();$('#walk-play').textContent='Pause guide';
 walkTimer=setInterval(()=>{walkStep++;renderWalkthrough();if(walkStep===3)stopWalk();},3500);
});
walkMotion.addEventListener('change',()=>{stopWalk();renderWalkthrough();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopWalk();});
['#verification-domain','#verification-rate','#verification-delays'].forEach(selector=>$(selector).addEventListener('change',stopWalk));
$('#verification-delays').addEventListener('click',stopWalk);

$$('[data-launch]').forEach(b=>b.addEventListener('click',()=>{
 let target;
 if(b.dataset.launch==='radio'){activateTab($('#tab-radio-outcome'));target=$('#radio-map-metric');}
 if(b.dataset.launch==='budget'){activateTab($('#tab-ran-budget'));renderBudget();target=$('#slo-target');}
 if(b.dataset.launch==='compare'){activateTab($('#tab-edge-admission'));setComparisonPreset('load');target=$('#edge-pin');}
 if(b.dataset.launch==='walk'){setWalkStep(0);target=$('#walk-slider');}
 history.replaceState(null,'',location.pathname+location.search+(b.dataset.launch==='radio'||b.dataset.launch==='budget'?'#radio-timing':b.dataset.launch==='compare'?'#edge-orchestration':'#control-verification'));
 target.focus({preventScroll:true});(target.closest('.interaction-heading')||$('#clock-walkthrough .interaction-heading')).scrollIntoView({block:'start',behavior:walkMotion.matches?'instant':'smooth'});
}));

renderRadio();renderQuality();renderLoad();renderPath();renderBudget();renderEdge();renderVerification();renderGate();renderCoverage();renderMap();
