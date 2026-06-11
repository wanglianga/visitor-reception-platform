# 访客接待平台

企业访客接待管理平台，支持被访员工预约、前台登记、安保门禁管控、会议室协调、敏感区域通行审批和会议延时联动全流程闭环管理。

## 原始需求

> 建设一个给企业前台、被访员工、安保人员和会议室管理员使用的访客接待平台，React 页面展示预约队列、证件核验、门禁权限和会议安排，NestJS 保存访客资料、审批记录、通行轨迹和离场结果。被访员工提交访客姓名、单位、来访事由、预计时间和是否需要会议室；前台核验证件、拍照、打印访客牌并确认随行人数；安保人员控制可通行楼层、闸机权限和异常滞留；会议室管理员协调会议室、茶水、设备和延时使用。系统要把预约申请、员工确认、前台登记、门禁授权、会议接待、离场回收连成闭环。证件不符、临时加人、访客超时未离场、会议室冲突要触发不同业务处理。

> 加入敏感区域通行审批。访客需要进入研发楼层、机房或样品间时，系统要求部门负责人额外审批；通行权限按时间段和楼层生效，超出范围的闸机刷卡要记录为安防异常。
> 支持会议延时联动。会议超出预约结束时间时，会议室管理员可以延长会议室占用，被访员工确认访客继续停留；若下一场会议已排定，系统提示换会议室或结束访客权限。

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
│   │   ├── access/           # 门禁模块（含敏感区域违规检测）
│   │   ├── meeting/          # 会议室模块（含延时联动）
│   │   ├── sensitive-area/   # 敏感区域模块（区域定义+审批流程）
│   │   ├── alert/            # 告警模块
│   │   ├── companion/        # 随行人员模块
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
| 被访员工 | 提交预约、确认/拒绝预约、确认随行人员、确认访客延时停留 |
| 前台 | 核验证件、拍照、打印访客牌、确认随行人数、访客签退 |
| 安保人员 | 控制可通行楼层、闸机权限、查看通行记录、异常滞留监控、敏感区域审批、安防异常处理 |
| 会议室管理员 | 协调会议室、茶水服务、设备配置、延时申请（联动员工确认）、冲突处理 |

## 核心功能

### 敏感区域通行审批

- 研发楼层（5F/6F）、机房（7F）、样品间（8F）为敏感区域
- 访客进入敏感区域需部门负责人审批
- 通行权限按时间段和楼层生效
- 超出允许楼层或时间段的闸机刷卡自动记录为安防异常
- 无审批刷卡进入敏感区域触发高等级告警

### 会议延时联动

- 会议超出预约结束时间时，会议室管理员发起延时申请
- 被访员工确认访客继续停留后延时生效
- 若下一场会议已排定，系统自动检测冲突：
  - 有空闲替换会议室 → 提示换会议室
  - 无替换会议室 → 提示结束访客权限
- 延时自动同步延长访客门禁有效期

## 异常告警

| 告警类型 | 触发条件 | 严重级别 |
|----------|----------|----------|
| 证件不符 | 访客信息与预约信息不匹配 | 高 |
| 临时访客 | 无预约直接到访登记 | 中 |
| 访客超时滞留 | 访客超过门禁有效期仍未离场（每5分钟自动检测） | 高 |
| 会议室冲突 | 同一会议室时间重叠预订 | 中/高 |
| 安防异常 | 访客在敏感区域楼层无审批刷卡或超出通行范围 | 高 |
| 敏感区域待审批 | 访客申请进入敏感区域等待部门负责人审批 | 高 |
| 会议延时申请 | 会议室管理员发起延时，需被访员工确认 | 中 |

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

#### 1. 安装依赖

```bash
cd backend
npm install
```

```bash
cd frontend
npm install
```

#### 2. 启动后端

```bash
cd backend
npm run build
npm run start:prod
```

后端运行在 http://localhost:3001

#### 3. 启动前端

```bash
cd frontend
npm run dev
```

前端运行在 http://localhost:5173，API 请求自动代理到后端

## API 接口

### 仪表盘

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /dashboard/stats | 获取统计概览（含敏感区域审批数、延时请求数） |
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
| POST | /access/records | 记录通行事件（自动检测敏感区域违规） |
| GET | /access/records | 查询通行记录 |
| GET | /access/overstay | 查询超时滞留访客 |
| GET | /access/overstay/records | 查询滞留处置记录 |
| GET | /access/overstay/detail/:visitorId | 查询滞留访客详情 |
| POST | /access/overstay/handle/:visitorId | 处置滞留访客 |

### 随行人员管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /companions | 登记临时随行人员 |
| GET | /companions | 查询随行人员列表 |
| GET | /companions/visitor/:visitorId | 查询指定访客的随行人员 |
| PATCH | /companions/:id/confirm | 被访员工确认随行人员 |
| PATCH | /companions/:id/reject | 被访员工拒绝随行人员 |

### 敏感区域管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /sensitive-areas | 查询敏感区域列表 |
| POST | /sensitive-areas | 创建敏感区域 |
| PATCH | /sensitive-areas/:id | 更新敏感区域 |
| DELETE | /sensitive-areas/:id | 删除敏感区域 |
| POST | /sensitive-areas/request-access | 访客申请敏感区域通行 |
| GET | /sensitive-areas/approvals | 查询审批列表 |
| GET | /sensitive-areas/approvals/visitor/:visitorId | 查询访客的审批记录 |
| PATCH | /sensitive-areas/approvals/:id/handle | 部门负责人审批（通过/驳回） |
| GET | /sensitive-areas/check-access | 检查访客是否有权进入某楼层 |

### 会议室管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /meeting-rooms | 查询会议室列表 |
| POST | /meeting-rooms | 创建会议室 |
| PATCH | /meeting-rooms/:id | 更新会议室 |
| GET | /meeting-bookings | 查询预订列表 |
| POST | /meeting-bookings | 创建预订 |
| PATCH | /meeting-bookings/:id | 更新/取消预订 |
| POST | /meeting-bookings/:id/extend | 直接延时（无冲突时） |
| POST | /meeting-bookings/:id/request-extension | 申请延时联动（含冲突检测和员工确认） |
| GET | /meeting-extension-requests | 查询延时申请列表 |
| PATCH | /meeting-extension-requests/:id/handle | 处理延时申请（批准/拒绝/换会议室） |
| POST | /meeting-extension-requests/:id/confirm-stay | 被访员工确认访客继续停留 |
| GET | /meeting-bookings/conflicts | 查询冲突 |

### 告警管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /alerts | 查询告警列表 |
| POST | /alerts | 创建告警 |
| PATCH | /alerts/:id/handle | 处理告警 |
