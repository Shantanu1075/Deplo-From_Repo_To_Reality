# Deplo - From Repo To Reality

**Deplo - From Repo To Reality** is a comprehensive full-stack solution that integrates a Next.js frontend, an API server, a build server, and an S3 reverse proxy. This project is structured to deliver a streamlined development and deployment pipeline from code to production.

---

## 📁 Project Structure

```
Deplo-From_Repo_To_Reality/
├── frontend-nextjs/        # Next.js frontend application
├── api-server/             # Backend API server
├── Build-Server/           # Project build scripts and configurations
├── s3-reverse-proxy/       # Reverse proxy for interfacing with AWS S3
```

---

## 🚀 Getting Started

### ✅ Prerequisites

Ensure the following are installed:

* **Node.js** (v14 or higher)
* **npm** or **Yarn**
* **Docker** (for containerization)
* **AWS CLI** (for S3 integration)

---

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Shantanu1075/Deplo-From_Repo_To_Reality.git
cd Deplo-From_Repo_To_Reality
```

### 2. Install Dependencies

Navigate to each directory and run:

#### Frontend

```bash
cd frontend-nextjs
npm install
```

#### API Server

```bash
cd ../api-server
npm install
```

#### Build Server

```bash
cd ../Build-Server
npm install
```

#### S3 Reverse Proxy

```bash
cd ../s3-reverse-proxy
npm install
```

---

## ⚙️ Usage

### Start Each Component

#### 1. API Server

```bash
cd api-server
npm start
```

#### 2. Frontend

```bash
cd ../frontend-nextjs
npm run dev
```

#### 3. S3 Reverse Proxy

```bash
cd ../s3-reverse-proxy
npm start
```

#### 4. Build Project

```bash
cd ../Build-Server
npm run build
```

---

## 🔐 Environment Variables

Each directory requires a `.env` file with relevant environment variables. Refer to each folder’s README or sample `.env.example` for guidance.

---

## 📦 Deployment

Containerize and deploy using Docker.

### 1. Build Docker Images

```bash
docker-compose build
```

### 2. Run Containers

```bash
docker-compose up
```

Ensure your `docker-compose.yml` is configured properly for all services.
