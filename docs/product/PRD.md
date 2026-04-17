# AI生图平台产品需求文档 (PRD)

## 1. 项目概述

### 1.1 产品名称
**ArtFlow AI** - 智能创意绘画平台

### 1.2 产品定位
一个基于Web的AI图像生成平台，支持用户通过文本描述或参考图片生成高质量艺术作品，提供流畅的创作体验和作品管理功能。

### 1.3 目标用户
- 数字艺术创作者
- 设计师
- 内容创作者
- AI艺术爱好者

## 2. 功能需求

### 2.1 核心功能模块

#### 2.1.1 文生图 (Text-to-Image)
- 用户输入文本提示词生成图片
- 支持参数调整：
  - 图片尺寸（1024x1024, 1024x1536, 1536x1024等）
  - 生成数量（1-4张）
  - 模型选择（豆包Seedream等）
- 支持负面提示词（排除不需要的元素）
- 实时生成进度展示

#### 2.1.2 图生图 (Image-to-Image)
- 用户上传参考图片进行风格迁移或改造
- 支持调节强度/相似度参数
- 结合文本提示词进行精准控制
- 支持图片格式：PNG, JPG, WEBP

#### 2.1.3 创作历史
- 展示用户所有生成记录
- 支持按时间筛选（今日、本周、本月、全部）
- 支持按类型筛选（文生图、图生图）
- 支持图片下载、删除、重新生成
- 瀑布流/网格布局展示

#### 2.1.4 用户系统
- 用户注册/登录（邮箱+密码）
- JWT Token认证机制
- 个人信息管理（头像、昵称）
- 密码修改功能

#### 2.1.5 账号管理（管理员功能）
- 用户列表查看
- 用户状态管理（启用/禁用）
- 生成配额管理

## 3. 技术架构

### 3.1 前端技术栈
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: shadcn/ui
- **状态管理**: Zustand
- **图片展示**: Masonry/瀑布流布局
- **图标**: Lucide React

### 3.2 后端技术栈
- **框架**: FastAPI (Python)
- **数据库**: PostgreSQL (用户、历史记录)
- **缓存**: Redis (Token、生成队列)
- **对象存储**: MinIO (图片存储)
- **AI服务**: 豆包API (火山引擎)
- **ORM**: SQLAlchemy
- **迁移**: Alembic

### 3.3 部署环境
- Docker Compose编排
- 已启动服务：
  - PostgreSQL: localhost:5432
  - Redis: localhost:6379
  - MinIO: localhost:9000 (API) / 9001 (Console)

## 4. 页面设计规范

### 4.1 设计主题
- **风格**: 现代极简 + 科技感
- **主色调**: 深紫渐变 (#7C3AED → #4F46E5)
- **背景色**: 深色系 (#0F0F0F, #1A1A1A)
- **强调色**: 电光紫 (#A855F7)、青色 (#06B6D4)
- **字体**: Inter / Noto Sans SC

### 4.2 页面结构

#### 4.2.1 登录/注册页
- 居中卡片式布局
- 深色毛玻璃效果
- 粒子动画背景
- 表单切换动画

#### 4.2.2 主页面布局
- **左侧导航栏** (固定, 200px)
  - Logo区域
  - 功能菜单（文生图、图生图、历史记录）
  - 用户信息
- **顶部栏** (固定, 64px)
  - 页面标题
  - 生成额度显示
  - 用户头像下拉菜单
- **内容区** (自适应)
  - 主要内容展示

#### 4.2.3 文生图页面
- 左侧：参数设置面板
  - 提示词输入区（多行文本，带提示）
  - 负面提示词输入
  - 尺寸选择（预设按钮）
  - 数量滑块
  - 生成按钮（醒目渐变）
- 右侧：生成结果区
  - 图片网格展示
  - 下载/收藏按钮
  - 重新生成按钮

#### 4.2.4 图生图页面
- 左侧：参数设置面板
  - 图片上传区（拖放/点击）
  - 预览缩略图
  - 提示词输入
  - 强度滑块
- 右侧：生成结果区

#### 4.2.5 历史记录页面
- 筛选器栏（类型、时间、排序）
- 瀑布流/网格布局切换
- 图片卡片（悬浮效果）
- 批量操作（选择、删除、下载）

#### 4.2.6 个人中心
- 头像上传（圆形裁切）
- 基本信息表单
- 修改密码
- 生成统计

#### 4.2.7 账号管理页（仅管理员）
- 用户表格
- 分页
- 搜索/筛选
- 状态开关

## 5. API接口设计

### 5.1 认证相关
```
POST /api/auth/register      # 注册
POST /api/auth/login         # 登录
POST /api/auth/refresh       # 刷新Token
POST /api/auth/logout        # 登出
```

### 5.2 用户管理
```
GET    /api/users/me         # 获取当前用户信息
PUT    /api/users/me         # 更新个人信息
PUT    /api/users/password   # 修改密码
GET    /api/users            # 获取用户列表（管理员）
PUT    /api/users/{id}       # 更新用户（管理员）
```

### 5.3 图片生成
```
POST   /api/generate/text    # 文生图
POST   /api/generate/image   # 图生图
GET    /api/generate/status/{task_id}  # 查询任务状态
```

### 5.4 历史记录
```
GET    /api/history          # 获取历史记录
DELETE /api/history/{id}     # 删除单条记录
DELETE /api/history          # 批量删除
GET    /api/history/{id}/download  # 下载图片
```

## 6. 数据模型

### 6.1 用户表 (users)
```sql
- id: UUID PK
- email: VARCHAR(255) UNIQUE
- password_hash: VARCHAR(255)
- nickname: VARCHAR(100)
- avatar_url: VARCHAR(500)
- is_admin: BOOLEAN DEFAULT FALSE
- is_active: BOOLEAN DEFAULT TRUE
- quota_daily: INT DEFAULT 10
- quota_used: INT DEFAULT 0
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 6.2 生成记录表 (generations)
```sql
- id: UUID PK
- user_id: UUID FK
- type: ENUM('text2img', 'img2img')
- prompt: TEXT
- negative_prompt: TEXT
- width: INT
- height: INT
- image_count: INT
- strength: FLOAT  # 图生图强度
- status: ENUM('pending', 'processing', 'completed', 'failed')
- result_urls: JSON  # MinIO URL数组
- seed: BIGINT
- created_at: TIMESTAMP
- completed_at: TIMESTAMP
```

## 7. 交互细节

### 7.1 生成流程
1. 用户填写参数点击生成
2. 按钮进入loading状态，显示进度动画
3. 后端创建任务，返回task_id
4. 前端轮询任务状态
5. 完成后展示结果，自动保存到历史

### 7.2 图片上传
- 支持拖放上传
- 文件大小限制：10MB
- 格式验证
- 上传预览

### 7.3 历史记录
- 首次加载20条，滚动加载更多
- 图片懒加载
- 悬浮显示操作按钮
- 点击放大预览

## 8. 安全要求

- 密码bcrypt加密存储
- JWT Token过期机制（Access: 15min, Refresh: 7天）
- API限流（每分钟10次生成请求）
- 文件上传类型验证
- SQL注入防护（ORM参数化查询）

## 9. 性能优化

- 图片压缩和WebP格式
- Redis缓存热点数据
- 数据库索引优化
- CDN加速（生产环境）
- 前端代码分割

## 10. 项目目录结构

```
D:/day3/ai/
├── docs/product/PRD.md
├── frontend/              # Next.js前端
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── stores/
│   └── types/
├── backend/               # FastAPI后端
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── migrations/
│   └── tests/
└── docker-compose.yml
```

---
文档版本: v1.0
创建日期: 2026-04-17
