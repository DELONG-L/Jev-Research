# Jev Research Explorer

探索 [UTSCybeR 实验室](https://utscyber.com/)的三项通信网络研究，关注意图解释、决策、执行与结果验证。

**[浏览研究 →][home]** · [研究方向](#directions) · [图表数据][data]

[English website](https://delong-l.github.io/Jev-Research/?lang=en#top) · [English README](README.md)

[![Jev 研究探索：从快速决策，到实际工作的网络。概念控制环连接意图与状态、决策、执行和验证。](guides/previews/readme-cover-serif-zh.png)][home]

## 沿控制环路理解结果

决策延迟、执行确认与验证后的结果采用不同的测量终点，需结合策略正确性、排队和服务完成情况解读。

<a id="directions"></a>
## 三条研究方向

### 无线网络控制

查看不同到达率与用户设备速度下的 SLA 违约、小区边缘吞吐量和分组时延，并结合策略正确性、截止时间适配、排队与 A1/E2 控制路径理解结果。

[进入无线网络控制 →][wireless]

### 边缘服务编排

比较不同负载、截止时间和语义缓存条件下，正确且按时完成服务的情况。区分实时接纳配合建模执行与真实 OCR 服务，用 A/B 视图对照已有实验条件。

[进入边缘服务编排 →][edge]

### 闭环验证

从决策追踪到执行确认，再到验证后的结果。查看排队与执行回放、约束检查，以及文献中对测量终点和检查责任的报告情况。

[进入闭环验证 →][verification]

## 按条件探索已有记录

- **选择条件。** 查看场景、时间预算与已报告的汇总结果，区分仿真结果、真实模型调用、建模执行和软件栈测量。

- **带着上下文比较。** 在边缘服务的 A/B 视图中固定一组条件，再调整另一组；结合完成数量解读请求 p95。

- **跨语言继续探索。** 切换中英文时，保留当前选择的条件与探索状态。

<details>
<summary><strong>查看真实交互界面</strong></summary>

[![Jev Research Explorer 的实际中文界面，包含研究概览与各项互动证据的入口。](guides/previews/explorer-zh.jpg)][home]

[打开互动研究页面 →][home]

</details>

## 查看证据与来源

[论文与数据][studies] · [图表数据 JSON][data] · [英文指南](guides/explorer.md)

时间适配、策略正确性和验证后的完成率采用不同定义与分母。比较结果前，请结合所选视图的测量说明判断其含义。

<details>
<summary><strong>比较结果时，需要注意什么？</strong></summary>

- **证据来源：** 区分仿真、实测模型调用、建模服务执行，以及真实软件栈或服务的测量。

- **完成情况与延迟：** 请求 p95 使用各模型自身已完成的请求计算，需要与完成数量一起解读。

- **时间阈值：** 时间目标查询使用已有采样预算，不在采样点之间插值。

[英文指南](guides/explorer.md)说明各个视图的含义，并提供三项研究的论文、代码与完整数据集入口。

</details>

## 许可证

网站源码使用 [MIT 许可证](LICENSE)。内置 IBM Plex 字体保留 [SIL Open Font License 1.1](assets/fonts/OFL.txt)。

[浏览研究][home] · [英文指南](guides/explorer.md) · [封面说明](guides/visuals.md)

[home]: https://delong-l.github.io/Jev-Research/?lang=zh#top
[wireless]: https://delong-l.github.io/Jev-Research/?lang=zh#radio-timing
[edge]: https://delong-l.github.io/Jev-Research/?lang=zh#edge-orchestration
[verification]: https://delong-l.github.io/Jev-Research/?lang=zh#control-verification
[studies]: https://delong-l.github.io/Jev-Research/?lang=zh#studies
[data]: https://delong-l.github.io/Jev-Research/explorer-data.json
