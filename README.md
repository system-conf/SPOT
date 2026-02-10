# SPOT – Simple Personal Output Trigger 🎯

**A self-hosted, open-source webhook-to-push notification gateway** built with Next.js, MySQL, and the Web Push API.

![SPOT Banner](https://img.shields.io/badge/SPOT-Production%20Ready-success?style=for-the-badge) 
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)

---

## 🚀 What is SPOT?

SPOT transforms any webhook into instant mobile/desktop push notifications. Perfect for:
- **Developers**: Get alerts from CI/CD pipelines, monitoring tools, or custom scripts
- **Self-Hosters**: Own your notification pipeline without relying on third-party services
- **Teams**: Organize notifications by channels (e.g., "Production Errors", "Sales", "Deployments")

### Key Features

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

---

## 📸 Screenshots

> **Note**: Screenshots coming soon! Check the [walkthrough](./walkthrough.md) for detailed feature documentation.

---

## 🛠️ Quick Start

### Prerequisites
- **Node.js** 18+
- **MySQL** database (we use [Hostinger](https://hostinger.com/mysql-hosting))
- **Vercel account** (for deployment)

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
```

### 3. Setup Database

Run the migration script:

```bash
node migrate.js
```

This creates:
- `channels` (notification categories)
- `subscriptions` (push subscribers)
- `notifications` (message history)
- `scheduled_notifications` (future messages)

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and enable notifications!

---

## 📡 API Usage

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

---

## 🧪 Testing

You can easily test your SPOT instance using the included script:

1. Ensure your `.env` has the correct `API_SECRET`.
2. Run the test script:

```bash
node -r dotenv/config send-test-notification.js
```

This sends a rich notification (with image and badge) to all subscribers of the global channel.

### Using Channel API Keys

```bash
curl -X POST https://your-spot.vercel.app/api/notify \
  -H "Authorization: Bearer spot_abc123xyz..." \
  -d '{"title": "Error Alert", "body": "Database timeout"}'
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
│   │   │   ├── channels/        # Channel CRUD
│   │   │   ├── notify/          # Webhook endpoint
│   │   │   ├── stats/           # Analytics
│   │   │   ├── schedule/        # Scheduler CRUD
│   │   │   └── cron/            # Cron processor
│   │   └── page.tsx             # Homepage
│   ├── components/
│   │   ├── ChannelManager.tsx   # Channel UI
│   │   ├── AnalyticsDashboard.tsx
│   │   └── PushSetup.tsx        # Subscriber UI
│   ├── db/
│   │   ├── schema.ts            # Drizzle schema
│   │   └── index.ts             # MySQL client
│   └── lib/
│       └── push.ts              # Web Push logic
├── public/
│   ├── custom-sw.js             # Service Worker
│   └── manifest.json            # PWA config
├── drizzle.config.ts
└── migrate.js                   # DB migration
```

---

## 🔐 Security Best Practices

1. **Use strong API secrets** (32+ random characters)
2. **Enable HTTPS** (automatic on Vercel)
3. **Rotate channel API keys** regularly
4. **Restrict CRON_SECRET** to Vercel's cron requests only
5. **Review notification logs** in the Analytics dashboard

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Roadmap

- [ ] **Integration Bridge**: Discord/Telegram webhook mirroring
- [ ] **Chrome Extension**: "Send to SPOT" from any page
- [ ] **Email-to-Push**: Forward emails as notifications
- [ ] **Rate Limiting**: Prevent abuse with per-channel limits
- [ ] **Notification Templates**: Reusable message formats

See [task.md](./brain/task.md) for detailed progress tracking.

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

**Made with ❤️ for developers who want full control over their notifications.**
