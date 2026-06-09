# Visitor Reception Platform - Backend

## 原始需求

> Create a complete NestJS backend for a Visitor Reception Platform in d:\code\solocode-wl\wl-277\backend.
>
> Requirements:
> - Use NestJS with TypeORM and SQLite (better-sqlite3)
> - The backend serves 4 roles: Front Desk, Visited Employee, Security Personnel, Meeting Room Admin
>
> Entities needed:
>
> 1. **Visitor** - id, name, company, phone, idNumber, idType, photo, accompanyCount, status (pending/registered/in_building/left/rejected), createdAt, updatedAt
> 2. **Appointment** - id, visitorName, visitorCompany, visitorPhone, purpose, expectedTime, needMeetingRoom(boolean), status (pending/confirmed/rejected/cancelled), employeeId, employeeName, visitorId(nullable), meetingRoomId(nullable), remark, createdAt, updatedAt
> 3. **AccessRecord** - id, visitorId, visitorName, floor, gate, direction(in/out), method(gate/manual), timestamp
> 4. **AccessPermission** - id, visitorId, visitorName, allowedFloors(string, comma-separated), gateEnabled(boolean), validFrom, validUntil, status(active/revoked), createdAt
> 5. **MeetingRoom** - id, name, floor, capacity, equipment(string), status(available/occupied/maintenance), createdAt
> 6. **MeetingBooking** - id, meetingRoomId, visitorId, visitorName, appointmentId, startTime, endTime, teaService(boolean), equipmentNeeded, extended(boolean), originalEndTime(nullable), status(pending/confirmed/cancelled/completed), createdAt
> 7. **Alert** - id, type(id_mismatch/temporary_visitor/timeout/meeting_conflict/overstay), severity(low/medium/high), visitorId, visitorName, message, handled(boolean), handledBy, handledAt, createdAt

## 启动方式

### 前置要求

- Node.js >= 18
- npm >= 9
- Docker & Docker Compose (optional, for containerized deployment)

### Docker 一键启动（推荐）

```bash
docker compose up --build
```

后台运行：

```bash
docker compose up --build -d
```

停止服务：

```bash
docker compose down
```

访问地址：http://localhost:3001

### 手动启动

#### 1. 安装依赖

```bash
npm install
```

#### 2. 启动服务

开发模式：

```bash
npm run start:dev
```

生产模式：

```bash
npm run build
npm run start:prod
```

访问地址：http://localhost:3001

## API Endpoints

### Appointments

- `POST /appointments` - Create appointment
- `GET /appointments` - List all (filter by `?status=pending|confirmed|rejected|cancelled`)
- `GET /appointments/pending?employeeId=1` - Get pending for employee
- `GET /appointments/:id` - Get one
- `PATCH /appointments/:id` - Confirm/reject

### Visitors

- `POST /visitors/register` - Register visitor (with appointmentId, photo, accompanyCount)
- `GET /visitors` - List all (filter by `?status=registered|in_building|left`)
- `GET /visitors/:id` - Get one
- `PATCH /visitors/:id` - Update visitor info
- `POST /visitors/:id/checkout` - Visitor leaves

### Access

- `POST /access/permissions` - Grant access permission
- `GET /access/permissions` - List permissions (filter by `?status=active|revoked`)
- `PATCH /access/permissions/:id` - Update/revoke permission
- `POST /access/records` - Record access event
- `GET /access/records` - List access records
- `GET /access/overstay` - Get overstayed visitors

### Meetings

- `GET /meeting-rooms` - List rooms
- `POST /meeting-rooms` - Create room
- `PATCH /meeting-rooms/:id` - Update room
- `GET /meeting-bookings` - List bookings (filter by `?status=pending|confirmed|cancelled|completed`)
- `POST /meeting-bookings` - Create booking
- `PATCH /meeting-bookings/:id` - Update/confirm/cancel booking
- `POST /meeting-bookings/:id/extend` - Extend booking
- `GET /meeting-bookings/conflicts?roomId=1&startTime=...&endTime=...` - Check conflicts

### Alerts

- `GET /alerts` - List alerts (filter by `?type=id_mismatch|temporary_visitor|timeout|meeting_conflict|overstay&handled=true|false`)
- `POST /alerts` - Create alert
- `PATCH /alerts/:id/handle` - Mark alert as handled

## Business Logic

- **Visitor registration**: Creates visitor record, links to appointment (if provided), auto-creates access permission (valid 8 hours, floor 1), checks ID mismatch with appointment, creates alert for temporary visitors without appointments
- **Visitor checkout**: Updates status to `left`, revokes active access permissions
- **Overstay detection**: Query-based via `GET /access/overstay` (finds visitors in_building with expired permissions)
- **Meeting conflict detection**: Checks time overlap for same room before creating/extending bookings
- **Alert generation**: Auto-created for ID mismatches, temporary visitors, and meeting conflicts

## Tech Stack

- NestJS 10
- TypeORM with better-sqlite3
- class-validator / class-transformer
- @nestjs/schedule
