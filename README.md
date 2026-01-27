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
*/30 * * * *
```
This runs the withdrawal sync job every 30 minutes at:
- 00:00
- 00:30
- 01:00
- 01:30
- 02:00
- 02:30
- 03:00
- 03:30
- 04:00
- 04:30
- 05:00
- 05:30
- 06:00
- 06:30
- 07:00
- 07:30
- 08:00
- 08:30
- 09:00
- 09:30
- 10:00
- 10:30
- 11:00
- 11:30
- 12:00
- 12:30
- 13:00
- 13:30
- 14:00
- 14:30
- 15:00
- 15:30
- 16:00
- 16:30
- 17:00
- 17:30
- 18:00
- 18:30
- 19:00
- 19:30
- 20:00
- 20:30
- 21:00
- 21:30
- 22:00
- 22:30
- 23:00
- 23:30

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
    ENROLLMENT_CRON
    WITHDRAWAL_CRON
    APPLICANT_CRON
    APPLICATION_FORM_CRON
    PROSPECT_FORM_CRON
    STUDENT_FORM_CRON
    TOUR_CRON
    ASSESSMENT_CRON
    NTFY_TOPIC
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
- *Enrollments Sync* – (Planned/Implemented) Syncs student enrollment data on schedule
- *Withdrawals Sync* – Fetches student withdrawals every 6 hours and pushes to Zoho Analytics
- *Applicants Sync* – (Planned/Implemented) Syncs student applicants data on schedule
- *Application forms Sync* – (Planned/Implemented) Syncs student application forms data on schedule
- *Prospect forms Sync* – (Planned/Implemented) Syncs student prospect forms data on schedule
- *Student forms Sync* – (Planned/Implemented) Syncs student forms data on schedule
- *Tour Sync* – (Planned/Implemented) Syncs student tour data on schedule
- *Assessment Sync* – (Planned/Implemented) Syncs student assessment data on schedule

## Exposed Endpoints
- *Enrollments Sync* – 
```bash 
    curl http://localhost:3000/api/sync/enrollments
```
- *Withdrawals Sync* – 
```bash 
    curl http://localhost:3000/api/sync/withdrawals
```
- *Applicants Sync* – 
```bash 
    curl http://localhost:3000/api/sync/applicants
```
- *Application forms Sync* – 
```bash 
    curl http://localhost:3000/api/sync/applicationForms
```
- *Prospect forms Sync* – 
```bash 
    curl http://localhost:3000/api/sync/prospectForms
```
- *Student forms Sync* – 
```bash 
    curl http://localhost:3000/api/sync/studentForms
```
- *Tour Sync* – 
```bash 
    curl http://localhost:3000/api/sync/tours
```
- *Assessment Sync* – 
```bash 
    curl http://localhost:3000/api/sync/assessments
```
- *All Sync* – 
```bash 
    curl http://localhost:3000/api/sync/all
``` 
