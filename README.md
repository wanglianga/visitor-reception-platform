# 访客接待平台

企业访客接待管理平台，支持被访员工预约、前台登记、安保门禁管控、会议室协调全流程闭环管理。

## 原始需求

> 建设一个给企业前台、被访员工、安保人员和会议室管理员使用的访客接待平台，React 页面展示预约队列、证件核验、门禁权限和会议安排，NestJS 保存访客资料、审批记录、通行轨迹和离场结果。被访员工提交访客姓名、单位、来访事由、预计时间和是否需要会议室；前台核验证件、拍照、打印访客牌并确认随行人数；安保人员控制可通行楼层、闸机权限和异常滞留；会议室管理员协调会议室、茶水、设备和延时使用。系统要把预约申请、员工确认、前台登记、门禁授权、会议接待、离场回收连成闭环。证件不符、临时加人、访客超时未离场、会议室冲突要触发不同业务处理。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Ant Design 5 + React Router 6 + Axios
- **后端**: NestJS 10 + TypeScript + TypeORM + better-sqlite3 + @nestjs/schedule
- **部署**: Docker + Docker Compose + Nginx

## 项目结构

```
├── backend/                  # NestJS 后端服务
│   ├── src/
│   │   ├── appointment/      # 预约模块
│   │   ├── visitor/          # 访客模块
│   │   ├── access/           # 门禁模块
│   │   ├── meeting/          # 会议室模块
│   │   ├── alert/            # 告警模块
│   │   ├── dashboard/        # 仪表盘统计模块
│   │   ├── seed/             # 初始数据填充模块
│   │   └── common/           # 枚举与公共定义
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── pages/            # 五个角色页面
│   │   │   ├── DashboardPage.tsx      # 工作台
│   │   │   ├── EmployeePage.tsx       # 被访员工
│   │   │   ├── FrontDeskPage.tsx      # 前台接待
│   │   │   ├── SecurityPage.tsx       # 安保管理
│   │   │   └── MeetingAdminPage.tsx   # 会议室管理
│   │   ├── components/       # 公共组件
│   │   │   └── AlertPanel.tsx         # 告警面板
│   │   ├── api/              # API 请求封装
│   │   └── types/            # TypeScript 类型定义
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
├── Dockerfile                # 根目录统一构建
├── docker-compose.yml        # Docker Compose 编排
└── .dockerignore
```

## 业务流程

预约申请 → 员工确认 → 前台登记 → 门禁授权 → 会议接待 → 离场回收

| 角色 | 功能 |
|------|------|
| 被访员工 | 提交预约（访客姓名、单位、事由、预计时间、是否需会议室）、确认/拒绝预约 |
| 前台 | 核验证件、拍照、打印访客牌、确认随行人数、访客签退 |
| 安保人员 | 控制可通行楼层、闸机权限、查看通行记录、异常滞留监控 |
| 会议室管理员 | 协调会议室、茶水服务、设备配置、延时使用、冲突处理 |

## 异常告警

| 告警类型 | 触发条件 | 严重级别 |
|----------|----------|----------|
| 证件不符 | 访客信息与预约信息不匹配 | 高 |
| 临时访客 | 无预约直接到访登记 | 中 |
| 访客超时滞留 | 访客超过门禁有效期仍未离场（每5分钟自动检测） | 高 |
| 会议室冲突 | 同一会议室时间重叠预订 | 中 |

## 启动方式

### Docker 一键启动（推荐）

#### 前置要求

- Docker 20.10+
- Docker Compose 2.0+

#### 启动步骤

```bash
docker compose up --build
```

后台运行：

```bash
docker compose up --build -d
```

停止并清理：

```bash
docker compose down
```

访问地址：http://localhost:5173

后端 API 地址：http://localhost:3001

---

### 手动启动

#### 前置要求

- Node.js 20+
- npm 9+

#### 1. 启动后端

```bash
cd backend
npm install
npm run build
npm run start:prod
```

后端运行在 http://localhost:3001

#### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:5173，API 请求自动代理到后端

## API 接口

### 仪表盘

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /dashboard/stats | 获取统计概览 |
| GET | /dashboard/recent-activity | 获取最近动态 |

### 预约管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /appointments | 创建预约 |
| GET | /appointments | 查询预约列表 |
| GET | /appointments/pending | 查询待确认预约 |
| PATCH | /appointments/:id | 更新预约（确认/拒绝） |

### 访客管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /visitors/register | 前台登记访客 |
| GET | /visitors | 查询访客列表 |
| PATCH | /visitors/:id | 更新访客信息 |
| POST | /visitors/:id/checkout | 访客签退 |

### 门禁管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /access/permissions | 授权门禁权限 |
| GET | /access/permissions | 查询权限列表 |
| PATCH | /access/permissions/:id | 更新/撤销权限 |
| POST | /access/records | 记录通行事件 |
| GET | /access/records | 查询通行记录 |
| GET | /access/overstay | 查询超时滞留访客 |

### 会议室管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /meeting-rooms | 查询会议室列表 |
| POST | /meeting-rooms | 创建会议室 |
| PATCH | /meeting-rooms/:id | 更新会议室 |
| GET | /meeting-bookings | 查询预订列表 |
| POST | /meeting-bookings | 创建预订 |
| PATCH | /meeting-bookings/:id | 更新/取消预订 |
| POST | /meeting-bookings/:id/extend | 延时使用 |
| GET | /meeting-bookings/conflicts | 查询冲突 |

### 告警管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /alerts | 查询告警列表 |
| POST | /alerts | 创建告警 |
| PATCH | /alerts/:id/handle | 处理告警 |
