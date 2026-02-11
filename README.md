# SPOT – Simple Personal Output Trigger 🎯

**A self-hosted, open-source webhook-to-push notification gateway** built with Next.js, MySQL, and Web Push API.

![SPOT Banner](https://img.shields.io/badge/SPOT-v2.0.0-success?style=for-the-badge) 
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)

---

## 🚀 What is SPOT?

SPOT transforms any webhook into instant mobile/desktop push notifications. Perfect for:
- **Developers**: Get alerts from CI/CD pipelines, monitoring tools, or custom scripts
- **Self-Hosters**: Own your notification pipeline without relying on third-party services
- **Teams**: Organize notifications by channels (e.g., "Production Errors", "Sales", "Deployments")

---

## 🎯 Why SPOT? What Makes It Different?

### The Problem
Existing notification services have several limitations:

| Issue | Traditional Services | SPOT |
|--------|---------------------|------|
| **Data Privacy** | Your data goes through third-party servers | **100% Self-Hosted** - Your data stays on your servers |
| **Customization** | Limited customization options | **Full Control** - Modify source code as needed |
| **Cost** | Expensive for high-volume notifications | **Free** - No monthly fees or per-notification charges |
| **Vendor Lock-in** | Difficult to migrate away | **Open Source** - No vendor lock-in |
| **Integration** | Complex setup for custom integrations | **Simple Webhook** - Send from any service |
| **Offline Support** | Often requires internet connection | **PWA Ready** - Works offline with service workers |
| **Channel Organization** | Flat notification structure | **Multi-Channel** - Organize by category |

### Key Differentiators

#### 1. **Complete Data Ownership**
Unlike Pushover, Pushbullet, or similar services, SPOT is **100% self-hosted**. Your notification data, subscriber information, and analytics stay on your own servers. No third-party data processing, no privacy concerns.

#### 2. **Webhook-First Design**
SPOT is designed as a webhook gateway. Any service that can send HTTP requests can trigger notifications:
- GitHub Actions
- GitLab CI/CD
- Jenkins
- AWS CloudWatch
- Sentry
- Datadog
- Custom scripts
- And thousands more!

#### 3. **Multi-Channel Architecture**
Organize notifications by category with unique API keys per channel:
```
┌─────────────────────────────────────────────────────────┐
│                    SPOT Instance                       │
├─────────────────────────────────────────────────────────┤
│  🚀 Deployments   →  deploy_abc123...               │
│  🐛 Bugs           →  bugs_xyz789...                 │
│  💰 Sales          →  sales_def456...                │
│  📊 Analytics      →  analytics_ghi012...            │
└─────────────────────────────────────────────────────────┘
```

#### 4. **Rich Notifications**
SPOT supports the full Web Push API specification:
- Large images
- Custom badges
- Action buttons (e.g., "View Dashboard", "Acknowledge")
- URL redirection
- Custom icons

#### 5. **Zero Cost**
No monthly fees, no per-notification charges, no tiered pricing. Host it on Vercel, Railway, or your own server for free.

#### 6. **Developer-Friendly**
- Simple REST API
- TypeScript support
- Comprehensive documentation
- Easy integration with existing tools

---

## ✨ Features

### Core Features

| Feature | Description |
|---------|-------------|
| 📡 **Multi-Channel System** | Organize notifications with unique API keys per channel |
| 🖼️ **Rich Notifications** | Support for large images and custom badges |
| 🎯 **Actionable Buttons** | Add click-to-action buttons to notifications (e.g., "View Dashboard", "Acknowledge") |
| 📊 **Analytics Dashboard** | Track delivery rates, channel activity, and 7-day trends |
| ⏰ **Scheduled Notifications** | Cron-based scheduling with daily/weekly/monthly repeats |
| 🔒 **Dual Authentication** | Global API secret + per-channel keys |
| 💾 **MySQL Persistence** | All notifications and channels stored in your own database |
| 📱 **PWA Ready** | Install as a native app on mobile and desktop |

### Security Features

| Feature | Description |
|---------|-------------|
| 🛡️ **Rate Limiting** | Prevent abuse with configurable request limits per IP |
| 🌐 **CORS Control** | Restrict API access to specific origins |
| 🚫 **IP Filtering** | Whitelist/Blacklist support with CIDR notation |
| 📋 **Security Logging** | Track all security events for monitoring |
| 🔐 **Webhook Signature** | Optional HMAC-SHA256 signature verification |
| 🔒 **Security Headers** | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection |

### New in v2.0.0

| Feature | Description |
|---------|-------------|
| 📋 **Notification Templates** | Create reusable notification templates with variables |
| 🔄 **Pagination** | Efficiently browse large lists of notifications and subscriptions |
| 🔍 **Advanced Filtering** | Filter by channel, status, date range, and search text |
| 👥 **Subscription Management** | View, enable/disable, and manage all subscriptions |
| 📊 **User Agent Detection** | Automatically detect browser/device type |

---

## 📸 Screenshots

> **Note**: Screenshots coming soon! Check [CHANGELOG.md](./CHANGELOG.md) for detailed feature documentation.

---

## 🛠️ Quick Start

### Prerequisites
- **Node.js** 18+
- **MySQL** database (we use [Hostinger](https://hostinger.com/mysql-hosting))
- **Vercel account** (for deployment)

> **Note**: SPOT uses **MySQL** as the database. The `sqlite.db` file in the project root is a legacy file and can be safely ignored.

### 1. Clone & Install

```bash
git clone https://github.com/system-conf/SPOT.git
cd SPOT
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
# MySQL Database (Hostinger or your own)
DATABASE_URL="mysql://user:password@host:3306/database"

# VAPID Keys (generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY"
VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY"
VAPID_EMAIL="mailto:your@email.com"

# API Security
API_SECRET="your-super-secret-key"
CRON_SECRET="your-cron-secret" # For scheduled notifications

# Security Configuration (Optional but recommended)
CORS_ALLOWED_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"
IP_WHITELIST="192.168.1.0/24,10.0.0.0/8"
RATE_LIMIT_WINDOW="60000"
RATE_LIMIT_MAX_REQUESTS="100"
WEBHOOK_SECRET="your-webhook-secret-key"
```

### 3. Setup Database

Run migration script:

```bash
npm run db:push
```

This creates:
- `channels` (notification categories)
- `subscriptions` (push subscribers)
- `notifications` (message history)
- `scheduled_notifications` (future messages)
- `notificationTemplates` (reusable templates)

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and enable notifications!

---

## 📡 API Usage

> **Looking for code examples in your favorite programming language?** Check out [CODE_EXAMPLES.md](./CODE_EXAMPLES.md) for examples in Python, Node.js, Rust, Go, Ruby, Java, PHP, Bash, GitHub Actions, and Jenkins!

### Send a Notification

```bash
curl -X POST https://your-spot.vercel.app/api/notify \
  -H "Authorization: Bearer YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deployment Success",
    "body": "v2.0 is now live in production!",
    "url": "https://yourapp.com/dashboard",
    "image": "https://example.com/large-image.jpg",
    "badge": "https://example.com/badge.png",
    "actions": [
      {"title": "View Logs", "url": "/logs"},
      {"title": "Rollback", "url": "/rollback"}
    ]
  }'
```

### Use a Template

```bash
curl -X POST https://your-spot.vercel.app/api/notify \
  -H "Authorization: Bearer YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": 1,
    "variables": {
      "message": "Database connection timeout",
      "error": "Connection refused"
    }
  }'
```

### Schedule a Notification

```bash
curl -X POST https://your-spot.vercel.app/api/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Daily Standup Reminder",
    "body": "Team meeting in 10 minutes",
    "scheduledAt": "2026-02-11T09:00:00Z",
    "repeat": "daily",
    "timezone": "Europe/Istanbul"
  }'
```

### List Notifications (with Pagination & Filtering)

```bash
curl "https://your-spot.vercel.app/api/notifications?page=1&limit=20&status=success&channelId=1"
```

### List Subscriptions

```bash
curl "https://your-spot.vercel.app/api/subscriptions?page=1&limit=20&status=active"
```

### Manage Templates

```bash
# Create template
curl -X POST https://your-spot.vercel.app/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Error Alert",
    "title": "Error: {{message}}",
    "body": "An error occurred: {{error}}",
    "icon": "⚠️",
    "variables": [
      {"name": "message", "description": "Error message"},
      {"name": "error", "description": "Error details"}
    ]
  }'

# List templates
curl https://your-spot.vercel.app/api/templates

# Update template
curl -X PATCH https://your-spot.vercel.app/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "name": "Updated Error Alert",
    "title": "Error: {{message}}"
  }'

# Delete template
curl -X DELETE https://your-spot.vercel.app/api/templates \
  -H "Content-Type: application/json" \
  -d '{"id": 1}'
```

---

## 🧪 Testing

You can easily test your SPOT instance using the included script:

1. Ensure your `.env` has correct `API_SECRET`.
2. Run test script:

```bash
node -r dotenv/config send-test-notification.js
```

This sends a rich notification (with image and badge) to all subscribers of the global channel.

---

## ⚙️ Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/system-conf/SPOT.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your SPOT repository
   - Add environment variables from `.env`

3. **Setup Cron (Optional)**

   Create `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/process-scheduled",
       "schedule": "*/5 * * * *"
     }]
   }
   ```

   This processes scheduled notifications every 5 minutes.

---

## 🗂️ Project Structure

```
SPOT/
 ├── src/
 │   ├── app/
 │   │   ├── api/
 │   │   │   ├── channels/           # Channel CRUD
 │   │   │   ├── notify/             # Webhook endpoint
 │   │   │   ├── stats/              # Analytics
 │   │   │   ├── schedule/           # Scheduler CRUD
 │   │   │   ├── subscription/        # Push subscription management
 │   │   │   ├── subscriptions/       # Subscription list (pagination)
 │   │   │   ├── notifications/       # Notification history (pagination)
 │   │   │   ├── templates/          # Template management
 │   │   │   ├── cron/               # Cron processor
 │   │   │   ├── debug-env/          # Environment debug endpoint
 │   │   │   └── debug-db/           # Database debug endpoint
 │   │   └── page.tsx               # Homepage
 │   ├── components/
 │   │   ├── ChannelManager.tsx      # Channel UI
 │   │   ├── AnalyticsDashboard.tsx  # Analytics UI
 │   │   ├── PushSetup.tsx           # Subscriber UI
 │   │   ├── TemplateManager.tsx     # Template management UI (NEW)
 │   │   ├── SubscriptionManager.tsx  # Subscription management UI (NEW)
 │   │   ├── NotificationHistory.tsx  # Notification history UI (NEW)
 │   │   ├── Pagination.tsx          # Pagination component (NEW)
 │   │   └── NotificationFilters.tsx # Filtering component (NEW)
 │   ├── db/
 │   │   ├── schema.ts               # Drizzle schema
 │   │   └── index.ts                # MySQL client
 │   └── lib/
 │       ├── push.ts                  # Web Push logic
 │       ├── security.ts              # Security middleware (NEW)
 │       ├── pagination.ts            # Pagination helpers (NEW)
 │       ├── filters.ts               # Filtering helpers (NEW)
 │       └── templates.ts             # Template helpers (NEW)
 ├── public/
 │   ├── custom-sw.js                 # Service Worker
 │   └── manifest.json                # PWA config
 ├── drizzle.config.ts
 └── CHANGELOG.md                     # Version history (NEW)
```

---

## 🔐 Security Best Practices

1. **Use strong API secrets** (32+ random characters)
2. **Enable HTTPS** (automatic on Vercel)
3. **Rotate channel API keys** regularly
4. **Restrict CRON_SECRET** to Vercel's cron requests only
5. **Review notification logs** in Analytics dashboard
6. **Configure CORS** to restrict API access to trusted origins only
7. **Set up IP whitelist** for production environments
8. **Enable webhook signature verification** for external integrations
9. **Monitor security logs** regularly for suspicious activity
10. **Configure rate limits** appropriate for your use case

### Security Configuration

Add these environment variables to your `.env` file:

```env
# CORS Configuration
CORS_ALLOWED_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"
CORS_ALLOWED_METHODS="GET,POST,PUT,DELETE,OPTIONS"

# IP Filtering (CIDR notation supported)
IP_WHITELIST="192.168.1.0/24,10.0.0.0/8"
IP_BLACKLIST=""

# Rate Limiting
RATE_LIMIT_WINDOW="60000"  # Time window in milliseconds (default: 1 minute)
RATE_LIMIT_MAX_REQUESTS="100"  # Max requests per window

# Webhook Signature (optional, for external integrations)
WEBHOOK_SECRET="your-webhook-secret-key"
```

### Security Headers

All API responses include the following security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Roadmap

- [x] **Rate Limiting**: Prevent abuse with per-channel limits ✓
- [x] **Notification Templates**: Reusable message formats ✓
- [x] **Pagination**: Efficient list browsing ✓
- [x] **Advanced Filtering**: Filter by multiple criteria ✓
- [x] **Subscription Management**: View and manage subscriptions ✓
- [ ] **Integration Bridge**: Discord/Telegram webhook mirroring
- [ ] **Chrome Extension**: "Send to SPOT" from any page
- [ ] **Email-to-Push**: Forward emails as notifications
- [ ] **Mobile App**: Native iOS and Android apps

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)  
- Database powered by [Drizzle ORM](https://orm.drizzle.team/)  
- Push notifications via [web-push](https://github.com/web-push-libs/web-push)  
- Hosted on [Vercel](https://vercel.com/)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/system-conf/SPOT/issues)
- **Discussions**: [GitHub Discussions](https://github.com/system-conf/SPOT/discussions)
- **Email**: [Create an issue](https://github.com/system-conf/SPOT/issues/new) for private inquiries

---

## 📚 Additional Documentation

- [CODE_EXAMPLES.md](./CODE_EXAMPLES.md) - Code examples in Python, Node.js, Rust, Go, Ruby, Java, PHP, Bash, GitHub Actions, and Jenkins
- [CHANGELOG.md](./CHANGELOG.md) - Version history and release notes
- [Project Structure](#-project-structure) - Detailed file organization
- [API Usage](#-api-usage) - Complete API documentation
- [Security Best Practices](#-security-best-practices) - Security guidelines

---

**Made with ❤️ for developers who want full control over their notifications.**
