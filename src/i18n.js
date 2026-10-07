// Both languages share the original controls, rendered cells and numerical data.
const JevLocale = (() => {
  const zh = JSON.parse(document.getElementById('translation-zh').textContent);
  const folded = new Map(Object.entries(zh).map(([key, value]) => [key.toLowerCase(), value]));
  const nodeSources = new WeakMap(), attributeSources = new WeakMap();
  const attributes = ['aria-label', 'aria-valuetext', 'title', 'placeholder', 'alt'];
  const ignored = 'script,style,textarea,code,pre,[data-no-i18n]';
  const storageKey = 'jev-explorer-language';
  const normalize = value => value.replace(/\s+/g, ' ').trim();
  const telemetryName = value => ({fresh:'最新',stale:'过期',noisy:'含噪',contradictory:'存在冲突'})[value] || value;
  const reuseName = value => /recurr|repeat/i.test(value) ? '重复出现' : '持续变化';
  const cacheName = value => value === 'on' ? '开启' : '关闭';
  const patterns = [
    [/^(.*?) · (hosted|self-hosted|self-hosted reference)$/, (_, model, type) => `${model} · ${{hosted:'托管','self-hosted':'自托管','self-hosted reference':'自托管参考'}[type]}`],
    [/^self-hosted$/, () => '自托管'],
    [/^95% CI (.+)$/, (_, values) => `95% 置信区间 ${values}`],
    [/^Base · (.+)$/, (_, condition) => `基准 · ${condition}`],
    [/^(.+) · base condition$/, (_, condition) => `${condition} · 基准条件`],
    [/^(.+) vs same-model base$/, (_, value) => `${value}，相对同模型基准`],
    [/^(.+) of stack$/, (_, value) => `${value}，占阶段中位数之和`],
    [/^With (fresh|stale|noisy|contradictory) telemetry, Qwen JSON is within 1 s for (.+) of calls, while (.+) produce the complete correct policy\. The highest observed full-policy correctness here is (.+) at (.+)\.$/, (_, condition, timely, correct, model, best) => `使用${telemetryName(condition)}的遥测数据时，Qwen JSON 的 1 s 时限达成率为 ${timely}，完整策略正确率为 ${correct}。该条件下，${model} 的完整策略正确率最高，为 ${best}。`],
    [/^(.+): completion percentages at every measured point$/, (_, axis) => `${translate(axis)}：全部已测点的完成比例`],
    [/^All seven models are shown\. Use the condition controls for exact completion and latency values\. Selected condition: (.+)\.$/, (_, value) => `图中展示七个模型。选择实验条件可查看对应的完成率与时延。当前条件：${value}。`],
    [/^(.+)% on time$/, (_, target) => `${target}% 准时率`],
    [/^Deadline miss fractions at (.+)$/, (_, budget) => `${budget} 预算下的未达标比例`],
    [/^(.+): (.+) misses; toggle curve$/, (_, model, value) => `${model}：未达标 ${value}；切换曲线显示`],
    [/^(.+) of 7 models meet (.+)% at the (selected|previewed) budget of (.+)\.$/, (_, count, target, mode, budget) => `在${mode==='selected'?'所选':'预览'}的 ${budget} 预算下，7 个模型中有 ${count} 个达到 ${target}% 目标。`],
    [/^(.+) at inspected τ$/, (_, value) => `当前 τ 下为 ${value}`],
    [/^(.+): target not reached through 10 seconds$/, (_, model) => `${model}：在不超过 10 s 的范围内未达到目标`],
    [/^(.+): inspect first qualifying sampled budget, approximately (.+)$/, (_, model, budget) => `${model}：查看首次达到目标的预算采样点，约 ${budget}`],
    [/^Lighter = higher (.+) · (.+) · (higher|lower) is better\.$/, (_, metric, range, direction) => `颜色越浅，指标值越高。范围：${range}；${translate(metric)}越${direction==='higher'?'高':'低'}越好。`],
    [/^(.+), (change from base|measured values)\. Rows are intent rate and UE speed; columns are interpreters\.$/, (_, metric, mode) => `${translate(metric)}，${mode==='change from base'?'相对基准的变化':'实测数值'}。行表示意图到达率与 UE 速度，列表示解释器。`],
    [/^(.+), (.+) intents\/s, (.+) km\/h: (change )?(.+)$/, (_, model, rate, speed, delta, value) => `${model}，${rate} intents/s，${speed} km/h：${delta?'变化 ':''}${value}`],
    [/^Live admission \+ modeled execution · 4 req\/s · 4 interpretation slots · 2 s deadline · 5 nodes · (recurring|changing) descriptions$/, (_, reuse) => `实时接纳，执行过程采用模型计算 · 4 req/s · 4 个解释槽位 · 2 s 截止时间 · 5 个节点 · 描述${reuseName(reuse)}`],
    [/^Executed OCR service · (steady|bursty) arrivals · 2 s deadline · (recurring|changing) descriptions · cache (off|on)$/, (_, arrivals, reuse, cache) => `实际执行 OCR · ${arrivals==='steady'?'平稳':'突发'}到达 · 2 s 截止时间 · 描述${reuseName(reuse)} · 缓存${cacheName(cache)}`],
    [/^Correct, on-time completion · all measured (arrival rates|deadlines|cache conditions)$/, (_, sweep) => `正确且准时的完成率 · 各档已测${{'arrival rates':'到达率',deadlines:'截止时间','cache conditions':'缓存条件'}[sweep]}`],
    [/^Matches Tesseract's own accuracy on these images: (.+)\.$/, (_, accuracy) => `与 Tesseract 在这些图像上的识别准确率一致，为 ${accuracy}。`],
    [/^All (.+) arrivals remain accounted for\. The correct OCR completion denominator is the (.+) supported OCR requests; the (.+) unsupported requests are reported separately\.$/, (_, all, supported, unsupported) => `全部 ${all} 个请求均计入统计。正确 OCR 完成率以 ${supported} 个支持的 OCR 请求为分母，${unsupported} 个不支持请求单独统计。`],
    [/^(.+) supported requests$/, (_, count) => `${count} 个支持请求`],
    [/^Jev executes every supported OCR request compliantly and on time in this condition\. Its (.+) correct OCR completion is bounded by recognition accuracy\. (.+)$/, (_, rate, rest) => `该条件下，Jev 已完成所有支持的 OCR 请求，且均满足约束和时限要求。正确 OCR 完成率为 ${rate}，受到识别准确率限制。${translate(rest)}`],
    [/^With recurring descriptions cached, Jev and the three hosted LLMs each reach (.+); Laya remains at (.+)\. Cache reuse can preserve an incorrect decision\.$/, (_, rate, laya) => `重复描述且开启缓存时，Jev 与三个托管 LLM 的正确 OCR 完成率均为 ${rate}，Laya 为 ${laya}。复用缓存时，错误决策也可能重复出现。`],
    [/^At (.+) req\/s, Jev completes (.+) correctly and on time; DeepSeek completes (.+)\. At 4 req\/s DeepSeek has higher exact completion\. At 16 req\/s all three hosted LLMs are below 10%, while Jev remains at 90\.7%\. These are finite measured runs\.$/, (_, load, jev, deepseek) => `在 ${load} req/s 下，Jev 正确且准时的完成率为 ${jev}，DeepSeek 为 ${deepseek}。4 req/s 下 DeepSeek 的正确完成率更高。16 req/s 下三个托管 LLM 均低于 10%，Jev 为 90.7%。这些数值描述有限实验运行中的结果。`],
    [/^At (.+) s, Jev reaches (.+), DeepSeek (.+) and GLM (.+) correct, on-time completion\. Admission waiting, interpretation, service queueing, transfer and execution all consume this budget\.$/, (_, deadline, jev, deepseek, glm) => `在 ${deadline} s 预算下，Jev、DeepSeek 与 GLM 正确且准时的完成率分别为 ${jev}、${deepseek} 和 ${glm}。这一预算包含接纳等待、意图解释、服务排队、传输和执行的耗时。`],
    [/^With recurring descriptions cached, Jev and the three hosted LLMs reach (.+) completion\. Laya remains at (.+), and Qwen JSON at (.+)\. A cache can also repeat an incorrect decision\.$/, (_, rate, laya, qwen) => `重复描述且开启缓存时，Jev 与三个托管 LLM 的完成率为 ${rate}，Laya 为 ${laya}，Qwen JSON 为 ${qwen}。复用缓存时，错误决策也可能重复出现。`],
    [/^Mean decision share: (.+)$/, (_, share) => `平均决策时间占比：${share}`],
    [/^within (.+) s · all arrivals$/, (_, budget) => `${budget} s 内 · 全部到达请求`],
    [/^(.+) \/ (.+) eventually verified$/, (_, verified, all) => `${verified} / ${all} 最终通过验证`],
    [/^(.+) arrivals\/s · 1 decision slot · ρ (.+?)( · non-stationary)?$/, (_, rate, rho, nonstationary) => `${rate} arrivals/s · 1 个决策槽位 · ρ ${rho}${nonstationary?' · 非平稳':''}`],
    [/^(Transport|Edge) · (.+) s decision · (.+) s outcome budget\.$/, (_, domain, delay, budget) => `${translate(domain)} · 决策时延 ${delay} s · 结果验证预算 ${budget} s。`],
    [/^Attainment changes from (.+)% in isolation to (.+)% with the selected queue\. The loaded outcome p95 is (.+)\. The (.+) s target is this experiment's task budget\.$/, (_, isolated, loaded, p95, budget) => `单独执行的时限达成率为 ${isolated}%，所选队列条件下为 ${loaded}%。计入排队后的结果验证耗时 p95 为 ${p95}。实验使用 ${budget} s 的任务预算。`],
    [/^(.+) pp · 95% CI (.+)$/, (_, gain, ci) => `${gain} pp · 95% 置信区间 ${ci}`],
    [/^(.+)% · 95% family interval (.+)$/, (_, coverage, ci) => `${coverage}% · 95% 区间（按研究分组）${ci}`],
    [/^(.+) of 139 families(?: · (Selection|Generation|Computation|Unspecified) interface)?$/, (_, count, type) => `139 项研究中，${count} 项符合筛选条件${type?' · '+translate(type)+'接口':''}`],
    [/^(\d+)–(\d+) of (\d+)$/, (_, start, end, all) => `${start}–${end} / ${all}`],
    [/^(\d{4}) · (.+)$/, (_, year, workflow) => `${year} · ${translate(workflow)}`],
    [/^(Recurring|Changing) descriptions · cache (off|on) · 2 s deadline · 180 supported requests$/, (_, reuse, cache) => `描述${reuseName(reuse)} · 缓存${cacheName(cache)} · 2 s 截止时间 · 180 个支持请求`],
    [/^(.+) req\/s · (.+) s deadline · (recurring|changing) · cache (off|on)$/, (_, rate, deadline, reuse, cache) => `${rate} req/s · ${deadline} s 截止时间 · 描述${reuseName(reuse)} · 缓存${cacheName(cache)}`],
    [/^(.+) → (.+) correct$/, (_, a, b) => `${a} → ${b} 正确完成`],
    [/^(.+) correct on-time completion: A (.+), B (.+)$/, (_, model, a, b) => `${model} 正确且准时的完成率：A ${a}，B ${b}`],
    [/^(Transport|Edge) · (.+) s decision$/, (_, domain, delay) => `${translate(domain)} · 决策时延 ${delay} s`],
    [/^Checkpoint (\d) \/ 4$/, (_, step) => `第 ${step} 步，共 4 步`],
    [/^Checkpoint (\d): (.+)$/, (_, step, name) => `第 ${step} 步：${translate(name)}`],
    [/^ACK p95 (.+) · isolated arm · (.+) executions$/, (_, p95, n) => `ACK p95 ${p95} · 单独执行试验 · ${n} 次执行`],
    [/^(.+)% of isolated executions reach the verified outcome within the task's (.+) s budget\. The deadline is judged from arrival to verified outcome\.$/, (_, attainment, budget) => `单独执行时，${attainment}% 在 ${budget} s 预算内完成结果验证。计时从请求到达开始，到结果通过验证结束。`],
    [/^At (.+) arrivals\/s, (.+)% reach the verified outcome within (.+) s\. This arm uses the real FIFO decision queue and measured execution-time replay\.$/, (_, rate, attainment, budget) => `在 ${rate} arrivals/s 下，${attainment}% 在 ${budget} s 内完成结果验证。这组试验采用真实 FIFO 决策队列与实测执行时延回放。`],
    [/^Outcome p95 (.+) · 95% attainment CI (.+)% · (.+) eventually verified$/, (_, p95, ci, count) => `结果验证耗时 p95 ${p95} · 95% 达成率置信区间 ${ci}% · ${count} 最终通过验证`],
    [/^Outcome p95 (.+) · ρ (.+?)( · non-stationary)? · (.+) eventually verified$/, (_, p95, rho, nonstationary, count) => `结果验证耗时 p95 ${p95} · ρ ${rho}${nonstationary?' · 非平稳':''} · ${count} 最终通过验证`]
  ];

  function translate(value) {
    const text = normalize(value);
    if (zh[text]) return zh[text];
    if (folded.has(text.toLowerCase())) return folded.get(text.toLowerCase());
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(text)) return text.replace(pattern, replacement);
    }
    return value;
  }

  function readPreference() {
    const requested = new URLSearchParams(location.search).get('lang');
    if (requested === 'zh' || requested === 'zh-CN') return 'zh';
    if (requested === 'en') return 'en';
    try { return localStorage.getItem(storageKey) === 'zh' ? 'zh' : 'en'; }
    catch { return 'en'; }
  }
  let language = readPreference();

  function localizeText(node) {
    if (!node.parentElement || node.parentElement.closest(ignored) || !node.data.trim()) return;
    const previous = nodeSources.get(node);
    const english = previous && previous.output === node.data ? previous.english : node.data;
    const output = language === 'zh' ? translate(english) : english;
    nodeSources.set(node, {english, output});
    if (node.data !== output) node.data = output;
  }

  function localizeElement(element) {
    if (element.closest(ignored)) return;
    let sources = attributeSources.get(element);
    if (!sources) { sources = new Map(); attributeSources.set(element, sources); }
    for (const name of attributes) {
      const current = element.getAttribute(name);
      if (!current) continue;
      const previous = sources.get(name);
      const english = previous && previous.output === current ? previous.english : current;
      const output = language === 'zh' ? translate(english) : english;
      sources.set(name, {english, output});
      if (current !== output) element.setAttribute(name, output);
    }
  }

  function localize(root) {
    if (root.nodeType === Node.TEXT_NODE) { localizeText(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE || root.closest(ignored)) return;
    localizeElement(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) localizeText(node);
      else localizeElement(node);
    }
  }

  const observation = {subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes};
  const observer = new MutationObserver(records => {
    observer.disconnect();
    const roots = new Set(records.map(record => record.target));
    for (const root of roots) if (root.isConnected) localize(root);
    observer.observe(document.body, observation);
  });

  function applyLanguage(next, persist = false) {
    const headerBottom = document.querySelector('header').getBoundingClientRect().bottom;
    const anchor = Array.from(document.querySelectorAll('main h1,main h2,main h3,main h4,main p,main button,main select,main summary'))
      .filter(element => {
        const rect=element.getBoundingClientRect(), closed=element.closest('details:not([open])');
        return rect.width && rect.height && !element.closest('[hidden]') && (!closed || closed.querySelector('summary').contains(element))
          && rect.top>=headerBottom+8 && rect.top<innerHeight;
      })
      .sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top)[0];
    const anchorTop = anchor?.getBoundingClientRect().top;
    if (persist) {
      document.documentElement.setAttribute('data-language-changing', '');
      document.body.getBoundingClientRect(); // Apply the anchoring rule before text changes.
    }
    observer.disconnect();
    language = next;
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title = language === 'zh' ? zh['Jev · Decisions in Network Control'] : 'Jev · Decisions in Network Control';
    document.querySelector('meta[name=description]').content = language === 'zh'
      ? '汇总无线网络控制、边缘服务编排和闭环验证的实验结果，可比较不同条件下的决策时延、策略正确率和服务完成情况。'
      : 'Explore wireless network control, edge service orchestration, and closed-loop verification through measured outcomes, decision quality, deadlines and queues.';
    localize(document.body);
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed',button.dataset.language===language));
    if (persist) {
      const url = new URL(location.href); url.searchParams.set('lang', language);
      try { history.replaceState(null, '', url); } catch { /* Some file viewers disable history updates. */ }
      try { localStorage.setItem(storageKey, language); } catch { /* Offline browsing can disable storage. */ }
      document.getElementById('language-status').textContent = language==='zh'?'已切换至中文。':'Switched to English.';
      const restoreReadingPosition = () => {
        if (anchor?.isConnected && anchorTop !== undefined) window.scrollBy({top:anchor.getBoundingClientRect().top-anchorTop,behavior:'instant'});
      };
      restoreReadingPosition();
      requestAnimationFrame(() => {
        restoreReadingPosition();
        requestAnimationFrame(() => {
          restoreReadingPosition();
          document.documentElement.removeAttribute('data-language-changing');
        });
      });
    }
    observer.observe(document.body, observation);
  }
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click',()=>applyLanguage(button.dataset.language,true)));
  addEventListener('popstate',()=>applyLanguage(readPreference()));
  applyLanguage(language);
  return {translate};
})();
