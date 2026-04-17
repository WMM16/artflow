# ArtFlow AI - 智能创意绘画平台

一个基于Web的AI图像生成平台，支持文生图、图生图、历史记录管理等功能。

## 技术栈

### 后端
- **框架**: FastAPI (Python)
- **数据库**: PostgreSQL
- **缓存**: Redis
- **对象存储**: MinIO
- **AI服务**: 豆包API (火山引擎)

### 前端
- **框架**: React 18
- **语言**: JavaScript
- **UI组件库**: Ant Design 5
- **状态管理**: Zustand
- **构建工具**: Vite

## 快速开始

### 1. 启动基础设施

确保Docker中已经启动了PostgreSQL、Redis和MinIO：

```bash
docker-compose up -d postgres redis minio
```

### 2. 启动后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

后端服务将在 http://localhost:8000 启动。

### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 http://localhost:3000 启动。

## 功能特性

- **文生图**: 输入文本描述生成图片
- **图生图**: 上传参考图片进行风格转换
- **历史记录**: 查看和管理生成历史
- **用户系统**: 注册、登录、个人中心
- **账号管理**: 管理员可管理用户和配额

## 项目结构

```
D:/day3/ai/
├── docs/product/PRD.md      # 产品需求文档
├── backend/                 # FastAPI后端
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # Pydantic模型
│   │   └── services/       # 业务服务
│   ├── main.py             # 入口文件
│   └── requirements.txt    # Python依赖
├── frontend/               # React前端
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── layouts/       # 布局组件
│   │   ├── components/    # 通用组件
│   │   ├── stores/        # 状态管理
│   │   └── lib/           # 工具函数
│   ├── package.json       # Node依赖
│   └── vite.config.js     # Vite配置
└── docker-compose.yml     # Docker编排
```

## 配置说明

### 后端环境变量 (.env)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/artflow
REDIS_URL=redis://localhost:6379/0
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
SECRET_KEY=your-secret-key
DOUBAO_API_KEY=your-doubao-api-key
```

## API文档

启动后端后访问: http://localhost:8000/docs

## 截图

- 登录页: 深色主题，粒子动画背景
- 文生图: 左侧参数面板，右侧生成结果
- 图生图: 支持图片上传和参数调整
- 历史记录: 瀑布流布局展示
- 个人中心: 统计信息和设置
- 账号管理: 用户列表和管理

## 许可证

MIT License
