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

### 6. 首页布局改版(A 方案) — 状态: done
- Hero 改为左右分栏:左 "Hi, I'm Toby" + 定位 + 双 CTA;右原公式卡 → 替换为 `images/hero.png`(自 `picture.png` 复制)
- 新增数字条(strip):150/150 Cayley、top 5% AMC 10B、10/15 AIME II、top-10 学校目标
- "What you will find here" 4 卡由 grid-3 改为 grid-2(2×2)
- 新增 "Where to start" 三步路径(选目标 → 选年级 → 试一题)
- 新增 `.hero-photo`/`.strip`/`.stat`/`.step-no` CSS,含深色与移动端适配
- **后续调整**:用户要求把首页数字条(strip)移除以成绩统计,已删除该区块及对应 CSS(成绩内容仍保留在 `activities/results.html`)

### 7. 竞赛内容扩充 — 状态: done
- 新增页 `competition/comc.html`(COMC 加拿大公开赛,官方链接 cms.math.ca/competitions/comc/)
- 新增页 `competition/cmo.html`(CMO 加拿大奥赛,官方链接 cms.math.ca/competitions/cmo/)
- 竞赛中心改 grid-2 并加 COMC/CMO 卡片,meta 更新
- `competition/amc.html` 新增 "Getting to the AIME" 章节 + MAA/AoPS 官方链接,并引用个人成绩
- `competition/waterloo.html` 扩充 Fryer/Galois/Hypatia/Euler 表格 + CEMC 官方链接
- 全站页脚 Competition Math 列加入 COMC / CMO 链接(三种前缀变体)
- `data/index.json` 新增 COMC/CMO 条目,results 条目关键词/描述刷新

### 8. 真实竞赛成绩 — 状态: done
- `activities/results.html` 填入真实奖项表(按日期倒序):Cayley 150/150(2026-02-25)、AIME II 10/15(2026-02-11)、AMC 10B 123/150 top 5%(2025-11-13)、AMC 10A 111/150 top 10%(2025-11-05)、Fryer 36/40(2025-04-04)、Euclid 85/100 honour roll(2025-04-02)
- 新增 "Next goal":Help my school become a top-10 school in Canada
- 首页数字条、amc/waterloo 页内引用此成绩
- git 未提交(用户要求先不上传)

### 9. 招生官视角优化(P0/P1/P2)— 状态: done
- **P0 定位与叙事**:
  - 重写 `about.html`:个人故事(Grade 11 BC、目标 math+CS)、数学兴趣、可核验成绩时间线(带日期)、"Leadership & community"(领导力 = 公开讲座 + 教授竞赛,不写"学校 top-10 目标")、双受众定位(学习者 / 申请评审)
  - 首页 hero 改为以人为中心:"I learn it. Then I teach it." + 首次 Euclid → perfect Cayley 叙事
  - `activities/results.html`:删除 "Next goal top-10" 区块,改为 "Leadership & community"(公开讲座 + 继续教授竞赛)
- **P1 原创与过程可见**:
  - 新增 `reflections/` 板块 4 页:index(学习公开化)+ reading-notes + problem-of-the-season + my-own-problems,均为占位骨架
  - 全站导航/页脚加入 Reflections 链接
- **P2 双受众一致性**:About 与首页文案统一"既是学习资源也是诚实作品集"的口径
- `data/index.json` 新增 4 条 reflections,刷新 about/results 描述
- git 未提交