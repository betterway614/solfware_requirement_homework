# 大湾区经济社会发展大数据智能决策系统

基于大湾区11个城市26年（1999-2024）经济社会数据的多维度分析和智能建模，提供可视化洞察、趋势预测和决策建议的数据驱动决策支持平台。

## 项目概述

本项目是一个面向政府部门、研究机构和企业战略部门的智能决策支持系统，通过对大湾区经济社会发展数据的深度分析，为用户提供数据可视化、城市对比、趋势预测和报告生成等功能。

## 技术栈

### 后端技术栈
- **框架**: FastAPI 0.109+
- **ORM**: SQLAlchemy 2.0+
- **数据库**: SQLite (开发环境), PostgreSQL 15+ (生产环境)
- **缓存**: Redis 7.0+ (可选)
- **数据处理**: Pandas, NumPy
- **机器学习**: Scikit-learn, Statsmodels
- **API文档**: 自动生成 Swagger/OpenAPI

### 前端技术栈
- **框架**: React 18+
- **语言**: TypeScript 5.0+
- **构建工具**: Vite 5.0+
- **UI组件库**: Ant Design 5.12+
- **图表库**: ECharts 5.4+
- **状态管理**: Redux Toolkit
- **路由**: React Router 6.21+

## 功能模块

### 1. 数据仪表盘
- 区域总览大屏（GDP总和、总人口、进出口总额）
- 各城市核心指标卡片
- 城市GDP排名柱状图
- 人口增长趋势折线图
- 年度时间轴浏览

### 2. 数据分析
- **城市对比分析**: 多选城市进行指标对比，支持柱状图、雷达图、箱线图
- **指标关联分析**: 计算指标间Pearson相关系数，生成相关性热力图
- **趋势分析**: 指标趋势拟合、增长率计算、排名变化轨迹
- **数据查询**: 灵活的时间序列数据查询

### 3. 智能预测
- **单指标预测**: 支持线性回归、ARIMA、集成模型
- **预测参数配置**: 可设置预测时长（1-5年）、置信度
- **预测结果展示**: 历史数据+预测数据折线图、置信区间
- **模型准确性评估**: R²、MSE、MAE、AIC、BIC等指标
- **情景模拟**: 调整参数模拟不同情景下的指标变化

### 4. 报告中心
- 自动报告生成
- 自定义报告模板
- 报告管理（查看、下载、删除）
- 报告分享功能

## 数据指标体系

| 指标类别 | 指标名称 | 单位 |
|---------|---------|------|
| 经济指标 | 地区生产总值 | 亿元 |
| 贸易指标 | 进出口总额 | 亿美元 |
| 贸易指标 | 货物出口货值 | 亿美元 |
| 贸易指标 | 货物进口货值 | 亿美元 |
| 消费指标 | 零售业销售额 | 亿元 |
| 人口指标 | 城市人口 | 万人 |
| 旅游指标 | 留宿旅客 | 万人 |
| 通信指标 | 流动电话用户数目 | 万户 |

## 项目结构

```
data_analyse/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   ├── core/           # 核心配置
│   │   ├── db/             # 数据库
│   │   └── utils/          # 工具函数
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── components/     # 公共组件
│   │   ├── services/       # API服务
│   │   ├── types/          # 类型定义
│   │   ├── store/          # 状态管理
│   │   └── styles/         # 样式文件
│   ├── package.json
│   └── Dockerfile
├── data/                   # 数据文件
├── doc/                    # 文档
├── docker-compose.yml      # Docker编排
└── README.md
```

## 快速开始

### 环境要求
- Python 3.11+
- Node.js 18+
- SQLite (开发环境，默认使用)
- PostgreSQL 15+ (生产环境，可选)
- Redis 7.0+ (可选)
- Docker & Docker Compose (可选)

### 使用Docker部署（推荐）

1. 克隆项目
```bash
git clone <repository-url>
cd data_analyse
```

2. 启动服务
```bash
docker-compose up -d
```

3. 访问应用
- 前端: http://localhost
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

### 本地开发

#### 后端开发

1. 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

2. 配置环境变量
```bash
cp .env.example .env
# 默认使用SQLite数据库，无需配置PostgreSQL和Redis
```

3. 初始化数据库
```bash
python -m app.db.init_db
```

4. 启动后端服务
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**注意**: 开发环境默认使用SQLite数据库，避免了复杂的PostgreSQL和Redis配置，适合快速开发和测试。如果需要使用PostgreSQL和Redis，可以修改`.env`文件中的相关配置。

#### 前端开发

1. 安装依赖
```bash
cd frontend
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

3. 访问应用: http://localhost:5173

## API文档

启动后端服务后，访问 http://localhost:8000/docs 查看完整的API文档。

### 主要API端点

#### 数据服务
- `GET /api/v1/data/cities` - 获取所有城市列表
- `GET /api/v1/data/indicators` - 获取所有指标列表
- `GET /api/v1/data/timeseries` - 时间序列数据查询
- `POST /api/v1/data/compare` - 多城市对比数据
- `POST /api/v1/data/correlation` - 指标相关性计算
- `POST /api/v1/data/trend-analysis` - 趋势分析

#### 预测服务
- `POST /api/v1/prediction/predict/linear` - 线性回归预测
- `POST /api/v1/prediction/predict/arima` - ARIMA预测
- `POST /api/v1/prediction/predict/ensemble` - 集成模型预测
- `POST /api/v1/prediction/predict/simulation` - 情景模拟

## 数据导入

将CSV数据文件放入 `data/` 目录，然后运行数据导入脚本（待实现）。

## 性能指标

- 首页加载时间 < 3秒
- 图表渲染时间 < 1秒
- 数据查询响应时间 < 500ms
- 支持并发用户数 ≥ 100

## 系统可用性

- 系统可用性 ≥ 99.5%
- 数据备份周期：每日
- 故障恢复时间 < 2小时

## 浏览器支持

- Chrome 90+
- Edge 90+
- Safari 14+
- Firefox 88+

## 许可证

本项目仅供学习研究使用。

## 联系方式

如有问题或建议，请联系项目维护者。
