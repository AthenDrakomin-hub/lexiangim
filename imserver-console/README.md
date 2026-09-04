<div align="center">
  <img src="webconsole/web/src/assets/images/header/logo-mark.png" alt="LeXiang" width="120" />

  <h1>LeXiang Admin Console</h1>

  <p><strong>LeXiang · Make Communication Happier — IM Administration Console</strong></p>
  <p>A deeply customized fork of JuggleIM open-source project, managing apps, users, groups, messages, bots, integrations, monitoring, and analytics from one web UI.</p>

  <p>
    <img src="https://img.shields.io/badge/Version-v1.0.0%20LeXiang-2563EB?style=flat-square" alt="Version" />
    <img src="https://img.shields.io/badge/Go-1.25+-00ADD8?style=flat-square&logo=go&logoColor=white" alt="Go 1.25+" />
    <img src="https://img.shields.io/badge/Vue-3-42b883?style=flat-square&logo=vuedotjs&logoColor=white" alt="Vue 3" />
    <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL 8.0" />
  </p>

  <p>
    <a href="README.zh-CN.md">简体中文</a> ·
    <a href="https://www.juggle.im/">JuggleIM Website</a> ·
    <a href="https://github.com/juggleim/im-server">IM Server</a>
  </p>
</div>

---

LeXiang Admin Console is the operations layer for [JuggleIM](https://github.com/juggleim/juggleim-server), a self-hosted instant messaging platform. Built on the open-source version with **brand customization, role system upgrade, enhanced user management, and frontend engineering improvements**. It packages a Vue 3 admin UI, Go management APIs, and an API gateway into one deployable service.

## LeXiang Edition Upgrades

### Full-Stack Brand Customization

- **Brand Identity**: Logo, title, slogan ("LeXiang, Make Communication Happier"), and copyright all branded
- **Login Page Rewrite**: Desktop split-layout (left blue brand banner + right white login card), fixed HTML nesting issues, positioning anomalies, and duplicate input text
- **Field Optimization**: "Alias" → "Org Code", removed redundant invite code management
- **PWA Config**: Branded manifest.json, multi-size favicon adaptation

### Admin Role System Upgrade

| Role | Identifier | Limit | Permissions |
|------|------------|-------|-------------|
| Super Admin | `RoleType=0` | **Only 1 globally** | All features, including admin role management |
| App Admin | `RoleType=1` | Unlimited | App-level management, cannot modify Super Admin |

- New `POST /admingateway/accounts/updaterole` endpoint for modifying admin roles
- Backend constraints: cannot modify own role, only 1 Super Admin globally, cache auto-cleared after modification
- Account management page adds "Modify Role" button and dialog, role badges (Super Admin yellow / App Admin blue)

### Enhanced User CRUD Management

Built on top of existing search/ban with full user lifecycle management:

| Action | Endpoint | Description |
|--------|----------|-------------|
| Edit Profile | `POST /admingateway/apps/users/updateprofile` | Modify user nickname |
| Delete User | `POST /admingateway/apps/users/delete` | Delete user and local data |
| Reset Password | `POST /admingateway/apps/users/resetpassword` | Reset user login password |

- User management page action column adds: Edit, Reset Password, Ban/Unban, Delete
- All operations have dialog confirmation and error handling, delete requires secondary confirmation

### Frontend Engineering Improvements

- **useToast Composable**: New `src/composables/useToast.js`, replaces non-official `getCurrentInstance().proxy.$toast`, provides unified `toast/success/error/info` API
- **Meta Tag Fix**: Replaced deprecated `apple-mobile-web-app-capable` with standard `mobile-web-app-capable`, removed duplicate meta tags
- **i18n Enhancement**: Added `login.feedback.networkError` (EN/ZH), improved error code mapping
- **Login Page Fixes**: Fixed language switcher positioning, duplicate logo/title rendering, and duplicate input text

## Features

| Area | Capabilities |
| --- | --- |
| Application management | Create/import apps, service switches, callbacks, app credentials, org code management |
| Users and accounts | Dual-role admin system, user search/edit/delete/reset password/ban, groups, and bots |
| Message operations | Conversation inspection, history search, recall/delete, sensitive words, and custom interceptors |
| Push and storage | APNs, FCM/Android push, file storage providers, and client log collection |
| Communication services | RTC providers (Agora, ZEGO, LiveKit), SMS, email, and translation |
| Analytics and monitoring | User activity, private/group/chatroom messages, connections, and node performance |
| Developer tools | IM API debugging and connection inspection from the console |
| Internationalization | Built-in English and Simplified Chinese UI |

## Quick Start

### Prerequisites

- Go 1.25+
- MySQL 8.0+
- Node.js 16+ (for frontend development)
- A running [JuggleIM server](https://github.com/juggleim/im-server)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd imserver-console
```

### 2. Create the database

```sql
CREATE DATABASE jim_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
```

Tables are migrated automatically when the service starts.

### 3. Configure the console

Edit [`conf/config.yml`](conf/config.yml):

```yaml
port: 8091

log:
  logPath: ./logs
  logName: imserver-console

mysql:
  user: root
  password: your_mysql_password
  address: 127.0.0.1:3306
  name: jim_db

imApiDomain: http://127.0.0.1:9001
imAdminDomain: http://127.0.0.1:8090
```

`imApiDomain` is the IM service API address; `imAdminDomain` is the JuggleIM admin API address.

> **LeXiang Integrated Mode**: In im-server monolithic deployment, the admin console is served through im-server's port 8090, no need to start imserver-console separately.

### 4. Run

```bash
go run .
```

Open **http://127.0.0.1:8091** and sign in with:

```text
Username: admin
Password: 123456
```

> After first login, the Super Admin (admin) has full permissions. Create App Admins in "Account Info → User Management" and assign roles. For any non-local deployment, change the default password immediately. Do not commit production credentials to `conf/config.yml`.

## Frontend Development

The production frontend is already embedded in the Go binary. Run the Vue app separately only when working on the web UI:

```bash
cd webconsole/web
npm install
npm run dev
```

The Vite dev server proxies `/admingateway` to `http://127.0.0.1:8090` by default. To rebuild the embedded frontend:

```bash
npm run build
```

Build output is in `webconsole/web/dist/`, embedded via Go embed. Recompile the Go service after frontend changes.

## Architecture

```text
Browser
   │
   ▼
Vue 3 Admin UI (embedded, desktop split-layout)
   │  /admingateway
   ▼
Gin API + JWT Auth + API Gateway
   ├── MySQL (console config, admin accounts, user data)
   └── JuggleIM APIs (IM operations and runtime data)
```

### Admin Role Permission Model

```text
Super Admin (RoleType=0, only 1 globally)
  ├── All app management features
  ├── Admin account management (CRUD)
  ├── Modify admin roles (including demoting other Super Admins)
  └── System configuration

App Admin (RoleType=1, multiple allowed)
  ├── App-level user management (edit/delete/reset password/ban)
  ├── App configuration management
  └── Cannot modify Super Admin roles
```

## Project Structure

```text
.
├── apis/                  # HTTP handlers and request models
│   ├── account.go         # Admin accounts (incl. role modification)
│   └── user.go            # User management (incl. edit/delete/reset password)
├── services/              # Business logic
│   ├── accountservice.go  # Admin service (Super Admin uniqueness constraint)
│   └── userservice.go     # User service
├── dbs/                   # GORM data-access layer
│   ├── accountdao.go      # Admin DAO
│   └── userdao.go         # User DAO
├── commons/               # Config, auth, logging, migrations, and utilities
├── routers/               # Gin route registration
├── webconsole/            # Vue 3 + Vite admin console and Go embed loader
│   └── web/src/
│       ├── composables/   # Composables (useToast, etc.)
│       ├── views/login/   # Login page (LeXiang branded)
│       ├── views/user/    # Account management (role system)
│       ├── views/argument/# App management (user CRUD)
│       ├── locales/       # i18n EN/ZH
│       └── assets/        # Brand assets (Logo, favicon, etc.)
├── conf/                  # Runtime configuration
└── main.go                # Application entry point
```

## API Reference

### Admin Accounts

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admingateway/login` | Admin login |
| GET | `/admingateway/accounts/list` | Get admin list |
| POST | `/admingateway/accounts/add` | Create admin |
| POST | `/admingateway/accounts/delete` | Delete admin |
| POST | `/admingateway/accounts/disable` | Disable/enable admin |
| POST | `/admingateway/accounts/updaterole` | Modify admin role (LeXiang new) |

### User Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admingateway/apps/users/list` | Get user list |
| POST | `/admingateway/apps/users/ban` | Ban user |
| POST | `/admingateway/apps/users/unban` | Unban user |
| POST | `/admingateway/apps/users/updateprofile` | Edit user nickname (LeXiang new) |
| POST | `/admingateway/apps/users/delete` | Delete user (LeXiang new) |
| POST | `/admingateway/apps/users/resetpassword` | Reset user password (LeXiang new) |

## JuggleIM Ecosystem

- [im-server](https://github.com/juggleim/im-server) — high-performance, self-hosted IM server
- [Official documentation](https://www.juggle.im/docs/guide/intro/) — deployment, integration, SDK, and server API guides
- [Server API reference](https://www.juggle.im/docs/server/api/) — integrate users, groups, messages, chatrooms, and more

## Contributing

Issues and pull requests are welcome. Good first contributions include bug fixes, documentation improvements, new integration providers, tests, and UI refinements.

1. Fork the repository.
2. Create a feature branch.
3. Add tests where appropriate and verify the web/backend build.
4. Open a pull request with a clear description and screenshots for UI changes.

## License

Released under the [Apache License 2.0](LICENSE). The LeXiang brand customization includes brand identity on top of the open-source license; please retain brand attribution when redistributing.

---

<div align="center">
  <strong>LeXiang · Make Communication Happier</strong><br />
  <sub>Deeply customized from JuggleIM open-source project, v1.0.0 LeXiang Edition</sub>
</div>
