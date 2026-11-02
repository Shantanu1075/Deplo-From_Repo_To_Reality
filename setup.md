# Project Deplo — Setup Guide

This guide explains how to set up and run the Project Deplo application locally.

## 1. Create an Aiven Account

Create an account on Aiven and log in to the dashboard.

You will create the following services:

* PostgreSQL
* Kafka
* ClickHouse

---

## 2. Create PostgreSQL Service

### Create the service

1. Open the Aiven dashboard.
2. Click **Create service**.
3. Select **PostgreSQL**.
4. Select the **Free** plan.
5. Create the service.

### Configure `DATABASE_URL`

1. Open the PostgreSQL service.
2. Click **Reveal password**.
3. Copy the **Service URI**.
4. Open the project's `.env` file.
5. Paste the Service URI into:

```env
DATABASE_URL="your-postgresql-service-uri"
```

### Download `ca.pem`

1. Go to the PostgreSQL service.
2. Download the **CA certificate (`ca.pem`)**.
3. Replace the existing `ca.pem` inside the project's `certs` folder.

The structure should look similar to:

```text
Project Deplo/
├── certs/
│   └── ca.pem
```

---

## 3. Create Kafka Service

### Create the service

1. In Aiven, click **Create service**.
2. Select **Kafka**.
3. Select the **Free** plan.
4. Create the service.

### Configure Kafka credentials

1. Open the Kafka service.
2. Go to the **SASL** section.
3. Copy the **Service URI**.
4. Add it to `.env` as:

```env
KAFKA_BROKERS="your-kafka-service-uri"
```

5. Copy the Kafka SASL password.
6. Add it to `.env`:

```env
KAFKA_SASL_PASSWORD="your-kafka-password"
```

### Download `kafka.pem`

1. Download the Kafka certificate (`kafka.pem`).
2. Replace the existing certificate in the project's `certs` folder.
3. Also replace the certificate inside the `Build-Server` folder if one already exists there.

For example:

```text
Project Deplo/
├── certs/
│   └── kafka.pem
│
└── Build-Server/
    └── kafka.pem
```

### Create Kafka topic

1. Open the Kafka service in Aiven.
2. Go to **Topics**.
3. Create a new topic named:

```text
container-logs
```

Make sure the topic name is exactly:

```text
container-logs
```

---

## 4. Create ClickHouse Service

### Create the service

1. In Aiven, click **Create service**.
2. Select **ClickHouse**.
3. Select the **AWS** option.
4. Select the required/free plan if available.
5. Create the service.

### Configure ClickHouse credentials

1. Open the ClickHouse service.
2. Click **Reveal password**.
3. Copy the **Service URI**.
4. Add it to `.env`:

```env
CLICKHOUSE_URL="your-clickhouse-service-uri"
```

5. Copy the ClickHouse password.
6. Add it to `.env`:

```env
CLICKHOUSE_PASSWORD="your-clickhouse-password"
```

### Create the `log_events` table

1. Open the ClickHouse service.
2. Go to **Query Editor**.
3. Execute:

```sql
CREATE TABLE log_events (
  event_id UUID,
  timestamp DateTime MATERIALIZED now(),
  deployment_id Nullable(String),
  log String,
  metadata Nullable(String)
)
ENGINE=MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp);
```

---

## 5. Setup Prisma Database

Open a terminal and go to the project root:

```bash
cd ~/Desktop/Project\ Deplo
```

Load the environment variables:

<!-- ```bash
source .env
``` -->

Go to the Prisma package:

```bash
cd packages/prisma
```

Remove the existing migrations:

```bash
rm -rf prisma/migrations
```

Create the initial Prisma migration:

```bash
npx dotenv -e "../../.env" -- npx prisma migrate dev --name init
```

This will create a fresh migration based on the current Prisma schema and apply it to the PostgreSQL database configured in `DATABASE_URL`.

---

## 6. Install Dependencies

Go back to the project root:

```bash
cd ~/Desktop/Project\ Deplo
```

Install root dependencies:

```bash
npm install
```

Then install frontend dependencies:

```bash
cd frontend
npm install
```

---

## 7. Build-Server — AWS ECR Setup

Make sure **Docker Desktop** is running.

Then:

1. Open **AWS ECR**.
2. Find the `builder-server` repository.
3. Open the repository.
4. Click **View push commands**.
5. Copy the commands provided by AWS ECR.
6. Open the `Build-Server` project.
7. Paste/run the ECR commands there as required.

Make sure you are authenticated with AWS before pushing the Docker image.

---

## 8. Start API Server

Open a terminal:

```bash
cd ~/Desktop/Project\ Deplo/api-server
```

Start the API server:

```bash
node index.js
```

The API server should now be running.

---

## 9. Start S3 Reverse Proxy

Open another terminal:

```bash
cd ~/Desktop/Project\ Deplo/s3-reverse-proxy
```

Start the reverse proxy:

```bash
node index.js
```

Keep this terminal running.

---

## 10. Start Frontend

Open another terminal:

```bash
cd ~/Desktop/Project\ Deplo/frontend
```

Start the frontend development server:

```bash
npm run dev
```

The frontend should now be available at the URL shown by Vite in the terminal.

---

# Environment Variables

Before starting the application, make sure your `.env` contains the required values:

```env
DATABASE_URL="your-postgresql-service-uri"

KAFKA_BROKERS="your-kafka-service-uri"
KAFKA_SASL_PASSWORD="your-kafka-password"

CLICKHOUSE_URL="your-clickhouse-service-uri"
CLICKHOUSE_PASSWORD="your-clickhouse-password"
```

Do **not** commit `.env`, passwords, or certificate files containing private credentials to Git.

---

# Final Project Structure

After setup, the important files/folders should look approximately like:

```text
Project Deplo/
│
├── .env
├── certs/
│   ├── ca.pem
│   └── kafka.pem
│
├── api-server/
│   └── index.js
│
├── Build-Server/
│   └── kafka.pem
│
├── frontend/
│
├── packages/
│   └── prisma/
│       └── prisma/
│
└── s3-reverse-proxy/
    └── index.js
```

# Startup Order

For normal development, make sure the following are running:

### 1. Docker Desktop

Start Docker Desktop first.

### 2. API Server

```bash
cd ~/Desktop/Project\ Deplo/api-server
node index.js
```

### 3. S3 Reverse Proxy

```bash
cd ~/Desktop/Project\ Deplo/s3-reverse-proxy
node index.js
```

### 4. Frontend

```bash
cd ~/Desktop/Project\ Deplo/frontend
npm run dev
```

The Aiven PostgreSQL, Kafka, and ClickHouse services must also be running/available.

# Quick Setup Checklist

* [ ] Create Aiven account
* [ ] Create free PostgreSQL service
* [ ] Add PostgreSQL Service URI to `DATABASE_URL`
* [ ] Download and replace `certs/ca.pem`
* [ ] Create free Kafka service
* [ ] Add Kafka Service URI to `KAFKA_BROKERS`
* [ ] Add Kafka password to `KAFKA_SASL_PASSWORD`
* [ ] Download and replace `kafka.pem`
* [ ] Replace `kafka.pem` in `Build-Server`
* [ ] Create `container-logs` Kafka topic
* [ ] Create ClickHouse service on AWS
* [ ] Add ClickHouse Service URI to `CLICKHOUSE_URL`
* [ ] Add ClickHouse password to `CLICKHOUSE_PASSWORD`
* [ ] Create `log_events` table
* [ ] Run Prisma migration
* [ ] Run `npm install` in root
* [ ] Run `npm install` in `frontend`
* [ ] Start Docker Desktop
* [ ] Configure/push `builder-server` through AWS ECR
* [ ] Start API server
* [ ] Start S3 reverse proxy
* [ ] Start frontend
