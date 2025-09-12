# Arcadia

Arcadia is a **Node.js scheduler service** designed to run background jobs and automated tasks at defined intervals.  
It primarily handles data synchronization between external systems (e.g., ISAMS) and analytics platforms (e.g., Zoho Analytics).

---

## 🚀 Features
- Runs scheduled jobs using **cron expressions**  
- Automates fetching of **student enrollments and withdrawals** from ISAMS–Arcadia server  
- Pushes data to **Zoho Analytics** for reporting and insights  
- Logging support for monitoring job executions  
- Lightweight and container-friendly (standalone or Dockerized)

---

## 🛠️ Tech Stack
- **Node.js** (runtime)  
- **node-cron** (scheduler)  
- **Winston / custom logger** (logging)  
- **Axios / HTTP client** (API calls)  
- **MySQL / Zoho Analytics APIs** (data integration)

---

## ⚙️ Installation

Clone the repository:
```bash
git clone https://github.com/jaihind-at-lms/arcadia.git
cd arcadia
```

Install dependencies:
```bash
npm install
```

## Development
Run with live-reload using nodemon:
```bash
npm run dev
```

## Usage
Start the scheduler service:
```bash
npm start
```
Jobs run automatically based on cron schedules defined in the configuration (e.g., every 6 hours).

## ⏰ Example Job Schedule
```bash
0 */6 * * *
```
This runs the withdrawal sync job every 6 hours at:
- 00:00
- 06:00
- 12:00
- 18:00

## ⚙️ Project Structure

```bash
src/
├── config/
│   └── config.js
├── controllers/
│   └── withdrawalController.js
├── jobs/
│   └── withdrawalSyncJob.js
├── models/
│   └── withdrawal.js
├── routes/
│   └── withdrawalRoutes.js
├── utils/
│   └── logger.js
└── server.js
```

## 🔧 Configuration

The configuration file is located at `src/config/config.js`. It contains the following environment variables:
```bash
    CRON_INTERVAL
    ISAMS_CLIENT_ID
    ISAMS_CLIENT_SECRET
    ZOHO_CLIENT_ID
    ZOHO_CLIENT_SECRET
    ZOHO_REFRESH_TOKEN
    ZOHO_ORG_ID
    ZOHO_WORKSPACE_ID
    ZOHO_ENROLLMENT_VIEW_ID
    ZOHO_WITHDRAWAL_VIEW_ID
    ZOHO_FULL_NAME_PREFIX
    DB_HOST
    DB_NAME
    DB_USER
    DB_PASSWORD
```

## Current Jobs
- *Withdrawals Sync* – Fetches student withdrawals every 6 hours and pushes to Zoho Analytics
- *Enrollments Sync* – (Planned/Implemented) Syncs student enrollment data on schedule


