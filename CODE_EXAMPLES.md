# SPOT API Code Examples

This document contains code examples for using SPOT API in various programming languages.

---

## 📡 API Endpoint

```
POST https://your-spot.vercel.app/api/notify
```

### Headers
```
Authorization: Bearer YOUR_API_SECRET
Content-Type: application/json
```

---

## 🐍 Python

### Basic Notification

```python
import requests
import json

# Configuration
SPOT_URL = "https://your-spot.vercel.app/api/notify"
API_SECRET = "your_api_secret"

# Send notification
response = requests.post(
    SPOT_URL,
    headers={
        "Authorization": f"Bearer {API_SECRET}",
        "Content-Type": "application/json"
    },
    json={
        "title": "Deployment Success",
        "body": "v2.0 is now live in production!",
        "url": "https://yourapp.com/dashboard"
    }
)

print(response.json())
```

### Rich Notification with Image and Actions

```python
import requests

response = requests.post(
    "https://your-spot.vercel.app/api/notify",
    headers={
        "Authorization": f"Bearer {API_SECRET}",
        "Content-Type": "application/json"
    },
    json={
        "title": "Error Alert",
        "body": "Database connection timeout",
        "image": "https://example.com/error.png",
        "badge": "https://example.com/badge.png",
        "url": "https://yourapp.com/logs",
        "actions": [
            {"title": "View Logs", "url": "/logs"},
            {"title": "Restart", "url": "/restart"}
        ]
    }
)
```

### Using a Template

```python
import requests

response = requests.post(
    "https://your-spot.vercel.app/api/notify",
    headers={
        "Authorization": f"Bearer {API_SECRET}",
        "Content-Type": "application/json"
    },
    json={
        "templateId": 1,
        "variables": {
            "message": "Database connection timeout",
            "error": "Connection refused"
        }
    }
)
```

### Schedule a Notification

```python
import requests
from datetime import datetime, timedelta

# Schedule for tomorrow at 9 AM
scheduled_time = datetime.now() + timedelta(days=1)
scheduled_time = scheduled_time.replace(hour=9, minute=0, second=0)

response = requests.post(
    "https://your-spot.vercel.app/api/schedule",
    headers={
        "Content-Type": "application/json"
    },
    json={
        "title": "Daily Standup Reminder",
        "body": "Team meeting in 10 minutes",
        "scheduledAt": scheduled_time.isoformat() + "Z",
        "repeat": "daily",
        "timezone": "Europe/Istanbul"
    }
)
```

---

## 🟢 Node.js

### Basic Notification

```javascript
const fetch = require('node-fetch');

const SPOT_URL = 'https://your-spot.vercel.app/api/notify';
const API_SECRET = 'your_api_secret';

async function sendNotification() {
    const response = await fetch(SPOT_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_SECRET}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: 'Deployment Success',
            body: 'v2.0 is now live in production!',
            url: 'https://yourapp.com/dashboard'
        })
    });

    const data = await response.json();
    console.log(data);
}

sendNotification();
```

### Rich Notification

```javascript
const fetch = require('node-fetch');

async function sendRichNotification() {
    const response = await fetch('https://your-spot.vercel.app/api/notify', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_SECRET}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: 'Error Alert',
            body: 'Database connection timeout',
            image: 'https://example.com/error.png',
            badge: 'https://example.com/badge.png',
            url: 'https://yourapp.com/logs',
            actions: [
                { title: 'View Logs', url: '/logs' },
                { title: 'Restart', url: '/restart' }
            ]
        })
    });

    console.log(await response.json());
}

sendRichNotification();
```

### Using a Template

```javascript
const fetch = require('node-fetch');

async function sendTemplateNotification() {
    const response = await fetch('https://your-spot.vercel.app/api/notify', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_SECRET}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            templateId: 1,
            variables: {
                message: 'Database connection timeout',
                error: 'Connection refused'
            }
        })
    });

    console.log(await response.json());
}

sendTemplateNotification();
```

### Schedule a Notification

```javascript
const fetch = require('node-fetch');

async function scheduleNotification() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const response = await fetch('https://your-spot.vercel.app/api/schedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: 'Daily Standup Reminder',
            body: 'Team meeting in 10 minutes',
            scheduledAt: tomorrow.toISOString(),
            repeat: 'daily',
            timezone: 'Europe/Istanbul'
        })
    });

    console.log(await response.json());
}

scheduleNotification();
```

---

## 🦀 Rust

### Basic Notification

```rust
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let api_secret = "your_api_secret";

    let response = client
        .post("https://your-spot.vercel.app/api/notify")
        .header("Authorization", format!("Bearer {}", api_secret))
        .header("Content-Type", "application/json")
        .json(&json!({
            "title": "Deployment Success",
            "body": "v2.0 is now live in production!",
            "url": "https://yourapp.com/dashboard"
        }))
        .send()
        .await?;

    let data = response.json::<serde_json::Value>().await?;
    println!("{:?}", data);

    Ok(())
}
```

### Rich Notification

```rust
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let api_secret = "your_api_secret";

    let response = client
        .post("https://your-spot.vercel.app/api/notify")
        .header("Authorization", format!("Bearer {}", api_secret))
        .header("Content-Type", "application/json")
        .json(&json!({
            "title": "Error Alert",
            "body": "Database connection timeout",
            "image": "https://example.com/error.png",
            "badge": "https://example.com/badge.png",
            "url": "https://yourapp.com/logs",
            "actions": [
                {"title": "View Logs", "url": "/logs"},
                {"title": "Restart", "url": "/restart"}
            ]
        }))
        .send()
        .await?;

    let data = response.json::<serde_json::Value>().await?;
    println!("{:?}", data);

    Ok(())
}
```

---

## 🐹 Go

### Basic Notification

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

type Notification struct {
    Title string `json:"title"`
    Body  string `json:"body"`
    URL   string `json:"url"`
}

func main() {
    apiSecret := "your_api_secret"
    spotURL := "https://your-spot.vercel.app/api/notify"

    notification := Notification{
        Title: "Deployment Success",
        Body:  "v2.0 is now live in production!",
        URL:   "https://yourapp.com/dashboard",
    }

    jsonData, _ := json.Marshal(notification)

    req, _ := http.NewRequest("POST", spotURL, bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer "+apiSecret)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    fmt.Println("Status:", resp.Status)
}
```

---

## 💎 Ruby

### Basic Notification

```ruby
require 'net/http'
require 'json'
require 'uri'

api_secret = 'your_api_secret'
spot_url = URI('https://your-spot.vercel.app/api/notify')

notification = {
  title: 'Deployment Success',
  body: 'v2.0 is now live in production!',
  url: 'https://yourapp.com/dashboard'
}

http = Net::HTTP.new(spot_url.host, spot_url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(spot_url.path)
request['Authorization'] = "Bearer #{api_secret}"
request['Content-Type'] = 'application/json'
request.body = notification.to_json

response = http.request(request)
puts response.body
```

---

## ☕ Java

### Basic Notification

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class SpotNotification {
    public static void main(String[] args) throws Exception {
        String apiSecret = "your_api_secret";
        String spotUrl = "https://your-spot.vercel.app/api/notify";

        String jsonBody = """
            {
                "title": "Deployment Success",
                "body": "v2.0 is now live in production!",
                "url": "https://yourapp.com/dashboard"
            }
            """;

        HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(spotUrl))
            .header("Authorization", "Bearer " + apiSecret)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();

        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());

        System.out.println(response.body());
    }
}
```

---

## 🐘 PHP

### Basic Notification

```php
<?php

$apiSecret = 'your_api_secret';
$spotUrl = 'https://your-spot.vercel.app/api/notify';

$notification = [
    'title' => 'Deployment Success',
    'body' => 'v2.0 is now live in production!',
    'url' => 'https://yourapp.com/dashboard'
];

$ch = curl_init($spotUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($notification));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiSecret,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
```

---

## 📜 Bash / cURL

### Basic Notification

```bash
curl -X POST https://your-spot.vercel.app/api/notify \
  -H "Authorization: Bearer YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deployment Success",
    "body": "v2.0 is now live in production!",
    "url": "https://yourapp.com/dashboard"
  }'
```

### Rich Notification

```bash
curl -X POST https://your-spot.vercel.app/api/notify \
  -H "Authorization: Bearer YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Error Alert",
    "body": "Database connection timeout",
    "image": "https://example.com/error.png",
    "badge": "https://example.com/badge.png",
    "url": "https://yourapp.com/logs",
    "actions": [
      {"title": "View Logs", "url": "/logs"},
      {"title": "Restart", "url": "/restart"}
    ]
  }'
```

### Using a Template

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

---

## 🌐 GitHub Actions

### Send Notification on Deployment

```yaml
name: Deploy and Notify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Production
        run: |
          # Your deployment commands here
          echo "Deploying to production..."
      
      - name: Send SPOT Notification
        run: |
          curl -X POST ${{ secrets.SPOT_URL }}/api/notify \
            -H "Authorization: Bearer ${{ secrets.SPOT_API_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{
              "title": "Deployment Success",
              "body": "v${{ github.sha }} deployed to production!",
              "url": "https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }'
```

### Send Notification on Failure

```yaml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Tests
        id: tests
        run: |
          npm test
      
      - name: Notify on Failure
        if: failure()
        run: |
          curl -X POST ${{ secrets.SPOT_URL }}/api/notify \
            -H "Authorization: Bearer ${{ secrets.SPOT_API_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{
              "title": "CI/CD Failed",
              "body": "Tests failed on ${{ github.ref }}",
              "url": "https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }'
```

---

## 🔧 Jenkins

### Send Notification on Build Completion

```groovy
pipeline {
    agent any

    environment {
        SPOT_URL = 'https://your-spot.vercel.app/api/notify'
        SPOT_API_SECRET = credentials('spot-api-secret')
    }

    stages {
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
    }

    post {
        success {
            sh """
                curl -X POST ${SPOT_URL} \\
                  -H "Authorization: Bearer ${SPOT_API_SECRET}" \\
                  -H "Content-Type: application/json" \\
                  -d '{
                    "title": "Build Success",
                    "body": "Build #${BUILD_NUMBER} completed successfully",
                    "url": "${BUILD_URL}"
                  }'
            """
        }
        
        failure {
            sh """
                curl -X POST ${SPOT_URL} \\
                  -H "Authorization: Bearer ${SPOT_API_SECRET}" \\
                  -H "Content-Type: application/json" \\
                  -d '{
                    "title": "Build Failed",
                    "body": "Build #${BUILD_NUMBER} failed",
                    "url": "${BUILD_URL}"
                  }'
            """
        }
    }
}
```

---

## 📊 Additional Resources

- [API Documentation](README.md#-api-usage)
- [Security Best Practices](README.md#-security-best-practices)
- [Templates](README.md#-new-in-v200)
- [Scheduled Notifications](README.md#-api-usage)
