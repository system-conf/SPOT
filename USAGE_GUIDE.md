# SPOT - Kullanım Senaryoları

Bu dosya, SPOT projesinin farklı kullanım senaryolarını açıklar.

## 📋 İçindekiler

- [Kurulum](#kurulum)
- [Temel Kullanım](#temel-kullanım)
- [Webhook Gönderme](#webhook-gönderme)
- [Template Kullanımı](#template-kullanımı)
- [Zamanlanmış Bildirimler](#zamanlanmış-bildirimler)
- [Analytics Dashboard](#analytics-dashboard)
- [Abonelik Yönetimi](#abonelik-yönetimi)
- [Kanal Yönetimi](#kanal-yönetimi)

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- MySQL veya SQLite veritabanı
- (Opsiyonel) Redis veya Upstash Redis

### Adımlar

1. Depoyu klonlayın:
```bash
git clone https://github.com/system-conf/SPOT.git
cd SPOT
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Ortam değişkenlerini ayarlayın (`.env` dosyasını oluşturun):
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=spot

# API Security
API_SECRET=your-global-api-secret

# (Opsiyonel) Redis
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# (Opsiyonel) Webhook Signature
WEBHOOK_SECRET=your-webhook-secret
```

4. Veritabanı migration'unu çalıştırın:
```bash
node scripts/migrate.js
```

5. Uygulamayı başlatın:
```bash
npm run dev
```

6. Tarayıcıda açın: `http://localhost:3000`

---

## 📋 Temel Kullanım

### Push Notification Aboneliği

1. SPOT uygulamasını tarayıcınızda açın
2. "Bildirim İzni Ver" butonuna tıklayın
3. Tarayıcı bildirim iznine izin verin
4. Abonelik başarılı bir şekilde oluşturulur

---

## 📤 Webhook Gönderme

### Global API Secret ile Gönderme

```bash
curl -X POST http://localhost:3000/api/notify \
  -H "Authorization: Bearer YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deploy Başarılı",
    "body": "v2.0 sürümü yayında!",
    "icon": "https://example.com/icon.png",
    "url": "https://example.com/deploy"
  }'
```

### Kanal API Key ile Gönderme

1. Bir kanal oluşturun ve API key'i kopyalayın
2. Kanal API key'i kullanarak bildirim gönderin:

```bash
curl -X POST http://localhost:3000/api/notify \
  -H "Authorization: Bearer YOUR_CHANNEL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Yeni Mesaj",
    "body": "Bu bir test mesajdır",
    "icon": "🔔",
    "badge": "https://example.com/badge.png"
  }'
```

### Webhook Signature ile Güvenli Gönderme

```bash
# Signature oluştur (HMAC-SHA256)
timestamp=$(date +%s)
signature=$(echo -n "$timestamp.YOUR_WEBHOOK_SECRET" | openssl sha256 -hmac | cut -d' ' -f2)

curl -X POST http://localhost:3000/api/notify \
  -H "Authorization: Bearer YOUR_API_SECRET" \
  -H "X-Webhook-Signature: sha256=$signature" \
  -H "X-Webhook-Timestamp: $timestamp" \
  -H "Content-Type: application/json" \
  -d '{"title": "Güvenli Mesaj", "body": "Signature ile doğrulandı"}'
```

---

## 📝 Template Kullanımı

### Template Oluşturma

1. "Template Yönetimi" bölümüne gidin
2. "Yeni Template" butonuna tıklayın
3. Template bilgilerini girin:
   - **İsim**: Template adı
   - **Slug**: URL dostu benzersiz isim
   - **Başlık**: `{{variable}}` değişkenleri içerebilir
   - **İçerik**: `{{variable}}` değişkenleri içerebilir
   - **İkon**: İkon URL'si veya emoji
   - **Değişkenler**: Template için gerekli değişkenleri tanımlayın

### Template ile Bildirim Gönderme

```bash
curl -X POST http://localhost:3000/api/notify \
  -H "Authorization: Bearer YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": 1,
    "variables": {
      "username": "Ahmet",
      "action": "giriş yaptı"
    }
  }'
```

### Template Değişkenleri Örneği

Template'da kullanılan değişkenler:
```json
{
  "variables": [
    { "name": "username", "type": "text", "required": true },
    { "name": "action", "type": "text", "required": true },
    { "name": "count", "type": "number", "required": false, "defaultValue": "0" }
  ]
}
```

Template içeriği:
```
Merhaba {{username}}, {{action}}. Toplam {{count}} bildirim.
```

---

## ⏰ Zamanlanmış Bildirimler

### Tek Seferlik Zamanlanmış Bildirim

```bash
curl -X POST http://localhost:3000/api/schedule \
  -H "Authorization: Bearer YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hatırlatma",
    "body": "Toplantı 10 dakika sonra başlıyor",
    "scheduledAt": "2026-02-12T10:00:00",
    "timezone": "Europe/Istanbul"
  }'
```

### Tekrarlayan Zamanlanmış Bildirim

```bash
curl -X POST http://localhost:3000/api/schedule \
  -H "Authorization: Bearer YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Günlük Hatırlatma",
    "body": "Her gün saat 09:00''da hatırlat",
    "scheduledAt": "2026-02-12T09:00:00",
    "timezone": "Europe/Istanbul",
    "repeat": "daily"
  }'
```

**Tekrarlama Seçenekleri:**
- `none`: Tek seferlik
- `daily`: Her gün
- `weekly`: Her hafta
- `monthly`: Her ay

---

## 📊 Analytics Dashboard

### Dashboard Özellikleri

- **Toplam Bildirimler**: Gönderilen toplam bildirim sayısı
- **Başarılı/Başarısız**: Teslimat durumu
- **Başarı Oranı**: Başarılı bildirim yüzdesi
- **Son 7 Gün**: Günlük bildirim grafiği
- **Kanal Dağılımı**: Her kanaldan kaç bildirim

### Analytics API

```bash
curl -X GET http://localhost:3000/api/stats \
  -H "Authorization: Bearer YOUR_API_SECRET"
```

**Cevap Örneği:**
```json
{
  "total": 1250,
  "sent": 1180,
  "failed": 70,
  "successRate": 94,
  "channelStats": [
    { "name": "Deploy", "color": "#3B82F6", "count": 450 },
    { "name": "Alerts", "color": "#EF4444", "count": 730 }
  ],
  "dailyStats": [
    { "date": "2026-02-10", "count": 120 },
    { "date": "2026-02-11", "count": 85 }
  ]
}
```

---

## 👥 Abonelik Yönetimi

### Abonelikleri Görüntüleme

1. "Abonelik Yönetimi" bölümüne gidin
2. Tüm abonelikleri pagination ile görüntüleyin
3. Abonelikleri kanala göre filtreleyin
4. Aktif/pasif durumunu değiştirin

### Abonelik Silme

```bash
curl -X DELETE http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"id": 123}'
```

### Abonelik Durumunu Güncelleme

```bash
curl -X PATCH http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"id": 123, "isActive": false}'
```

### Abonelikleri Listeleme (API)

```bash
curl -X GET "http://localhost:3000/api/subscriptions?page=1&limit=20&channelId=1&isActive=true" \
  -H "Authorization: Bearer YOUR_API_SECRET"
```

---

## 📡 Kanal Yönetimi

### Kanal Oluşturma

1. "Kanal Yönetimi" bölümüne gidin
2. "Yeni Kanal" butonuna tıklayın
3. Kanal bilgilerini girin:
   - **İsim**: Kanal adı
   - **Slug**: URL dostu benzersiz isim (otomatik oluşturulur)
   - **Renk**: Kanal rengi (hex formatında)
   - **İkon**: İkon adı

### Kanal API Key'i Kullanma

```bash
# Kanal oluşturulduğunda otomatik olarak oluşturulan API key'i kullanın
curl -X POST http://localhost:3000/api/notify \
  -H "Authorization: Bearer spot_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"title": "Kanal Mesajı", "body": "Bu mesaj sadece bu kanala gider"}'
```

### Kanal Silme

```bash
curl -X DELETE http://localhost:3000/api/channels \
  -H "Authorization: Bearer YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"id": 1}'
```

---

## 🔐 Güvenlik Yapılandırması

### Rate Limiting

```env
# Rate Limiting Ayarları (.env dosyasında)
RATE_LIMIT_WINDOW=60000      # 60 saniye (1 dakika)
RATE_LIMIT_MAX_REQUESTS=100  # Maksimum istek sayısı
```

### CORS Kontrolü

```env
# CORS Ayarları (.env dosyasında)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
```

### IP Filtreleme

```env
# IP Filtreleme (.env dosyasında)
IP_WHITELIST=192.168.1.0/24,10.0.0.0/8
IP_BLACKLIST=1.2.3.4,5.6.7.8
```

---

## 🐛 Sorun Giderme

### Migration Sorunları

Eğer migration sırasında sorun yaşarsanız:

```bash
# Migration'ı manuel olarak çalıştırın
node scripts/migrate.js

# Veritabanı bağlantısını kontrol edin
mysql -h localhost -u root -p
```

### Redis Bağlantı Sorunları

Eğer Redis bağlantısında sorun yaşarsanız:

```bash
# Redis URL'sini kontrol edin
echo $UPSTASH_REDIS_REST_URL

# Token'ı kontrol edin
echo $UPSTASH_REDIS_REST_TOKEN

# Redis olmadan çalıştırın (fallback aktif olur)
# Redis olmadan uygulama çalışmaya devam eder
```

### Bildirim Teslimat Sorunları

Eğer bildirimler teslim edilmiyorsa:

1. Aboneliklerin aktif olduğunu kontrol edin
2. Tarayıcı bildirim izninin açık olduğunu kontrol edin
3. Service Worker'ın aktif olduğunu kontrol edin
4. Security Logs'te hataları kontrol edin

---

## 📚 Ek Kaynaklar

- [API Dokümantasyonu](CODE_EXAMPLES.md)
- [Değişiklik Günlüğü](CHANGELOG.md)
- [README](README.md)

---

## 🤝 Destek

Sorunlarınız için:
- GitHub Issues: https://github.com/system-conf/SPOT/issues
- GitHub Discussions: https://github.com/system-conf/SPOT/discussions
