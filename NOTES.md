# Toby Math — 修改记录 / Modification Notes

> 修改点在确认后统一记录在此。每条:状态(open / done)+ 内容。

## 修改点列表

### 1. 删除 Math Kangaroo — 状态: done
- 删除页面 `competition/math-kangaroo.html`
- 移除所有页面页脚中的 "Math Kangaroo" 链接
- 移除竞赛中心首页的 Math Kangaroo 卡片
- 更新首页/竞赛中心 meta description 文案(不再提 Kangaroo)
- 更新搜索索引 `data/index.json`(删条目、改概述关键词)
- AMC 测验第 3 题的干扰项 "Math Kangaroo" 改为 "Gauss contest"

### 2. 删除 AMC 页面上的 "Check your AMC scoring" 测验 — 状态: done
- 移除 `competition/amc.html` 中的 quiz 区块(3 道 AMC 计分题及解析)
- 移除该页多余的 `js/quiz.js` 引入

### 3. 首页 "Latest" 板块移除 — 状态: done
- 从 `index.html` 删除整个 "Latest" 区块(含两张卡片:AMC 入门、Math 10 概览)
- 主页现以板块入口卡(Competition Math / BC Courses / Activities / Topics / About)为主,无过期"最新"内容

### 4. 新增 "Activities" 板块 — 状态: done(占位骨架,内容待后续填充)
- 新建 `activities/index.html`(板块主页,入口卡)、`activities/results.html`(竞赛成绩)、`activities/public-lectures.html`(公开讲座)、`activities/teaching.html`(教学/辅导)
- 全站 18 个旧页面的主导航插入 "Activities" 链接(位置:BC Courses 之后、Topics 之前)
- 全站页脚 "Toby Math" 列加入 "Activities" 链接
- 首页新增 "Activities" 入口卡(What I do with math)
- 更新搜索索引 `data/index.json`(新增 4 条 activities 条目)
- 各页内容均为占位(TBA),访问者联系方式/讲座日程/成绩单等后续补充

### 5. (待定) AMC8 课件 — 状态: open
- 用户提出新增 AMC8 课件内容,但具体选题/承接页面尚未确定,暂未实施
- 待用户确认后再规划(可挂在 `competition/amc.html` 内,或新增 topics 页面)