# DEPLO — From Repo To Reality

**Turn a GitHub repository into a live website without manually cloning, installing dependencies, or building the project yourself.**

Deplo is a cloud-based deployment platform that automates the process of building frontend repositories and serving their output through unique project URLs. It uses isolated build environments, cloud storage, and real-time log streaming to make deployments easier to monitor and manage.

---

## Overview

Deploying a project locally usually requires cloning a repository, installing dependencies, configuring the environment, and running the build process. Deplo automates these steps through a cloud-based deployment pipeline.

Provide a GitHub repository URL, and Deplo builds the project and publishes the generated static files. Once the deployment succeeds, the application is accessible through its unique subdomain.

### Key Features

- **GitHub-based deployments:** Submit a repository URL to start a deployment.
- **Isolated builds:** Run each deployment in its own container using AWS ECS Fargate.
- **Automated build pipeline:** Clone repositories, install dependencies, and build applications.
- **Real-time build logs:** Monitor deployment progress through Socket.IO.
- **Asynchronous log processing:** Stream build logs through Kafka and store them in ClickHouse.
- **Cloud artifact storage:** Store generated application files in Amazon S3.
- **Subdomain-based routing:** Route requests to the correct deployment using a reverse proxy.
- **Deployment status tracking:** Store deployment metadata and track build outcomes.

---

## Demo

![Deplo screenshot — deployment interface](https://github.com/user-attachments/assets/9f7906c2-aab6-4dea-92a7-8a437acf853b)

![Deplo screenshot — project interface](https://github.com/user-attachments/assets/1b813e82-5e30-4b84-b33d-ee7cad630494)

![Deplo screenshot — deployment interface](https://github.com/user-attachments/assets/9cc66c94-ea4f-452d-ba90-5156b90bcb90)

---

## Architecture

Deplo separates request handling, application builds, log processing, and artifact delivery into distinct components.

### Deployment Workflow

1. **Submit a repository**  
   The user provides a GitHub repository URL through the Next.js frontend.

2. **Validate and register the deployment**  
   The Express API server validates the request using Zod, generates project and deployment identifiers, assigns a subdomain, and stores the metadata in PostgreSQL through Prisma.

3. **Start an isolated build**  
   The API server starts an AWS ECS Fargate task. The task uses a prebuilt Docker image stored in Amazon ECR to clone the repository, install dependencies, and build the application.

4. **Stream build logs**  
   The build container sends log events to Kafka. A consumer in the API layer processes these events, stores them in ClickHouse, and forwards them to the frontend through Socket.IO.

5. **Store build artifacts**  
   After a successful build, the generated static files are uploaded to Amazon S3. The files are organized using project and deployment identifiers.

6. **Serve the application**  
   The reverse proxy uses the project's subdomain to route incoming requests to the appropriate files in S3. The API updates the deployment status to `READY` or `FAIL`.

This workflow keeps builds separate from API request handling and allows multiple deployments to run independently.

---

## Technology Stack

| Technology | Purpose |
| --- | --- |
| Next.js and React | Frontend application |
| Tailwind CSS | Frontend styling |
| Node.js and Express.js | API server and backend request handling |
| Zod | API request validation |
| Prisma ORM | Database access and schema management |
| PostgreSQL | Project metadata, deployment records, and subdomain mappings |
| Docker | Containerized build environments |
| AWS ECS Fargate | Running isolated deployment tasks |
| Amazon ECR | Storing the Docker builder image |
| Amazon S3 | Storing generated static files |
| Apache Kafka | Asynchronous build-log streaming |
| ClickHouse | Persistent build-log storage and analytics |
| Socket.IO | Real-time communication with the frontend |

---

## Project Structure

The repository is organized into separate components for the frontend, API, build execution, database management, and artifact delivery.

| Directory or file | Responsibility |
| --- | --- |
| `frontend/` | Next.js frontend application |
| `api-server/` | Express API, deployment orchestration, and log processing |
| `Build-Server/` | Docker-based build environment and build scripts |
| `packages/prisma/` | Prisma schema, database configuration, and migrations |
| `s3-reverse-proxy/` | Routes requests to the correct stored build artifacts |
| `.env.example` | Example environment configuration |
| `setup.md` | Additional setup instructions |

---

## Getting Started

### Prerequisites

Before setting up Deplo, make sure you have:

- Node.js and npm
- Yarn, where required by the frontend
- Docker
- An AWS account with the required permissions
- AWS CLI configured for your environment
- A PostgreSQL database
- Kafka and ClickHouse services
- The required environment variables and certificates

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/Shantanu1075/Deplo-From_Repo_To_Reality.git
cd Deplo-From_Repo_To_Reality
```

#### 2. Configure environment variables

Review `.env.example` and `setup.md`. Configure the required database, AWS, Kafka, ClickHouse, and service connection settings for your environment.

**Do not commit credentials, private keys, or secret environment files to version control.**

#### 3. Install dependencies

Install dependencies for the frontend, API server, build server, and reverse proxy using the package manager specified for each component.

#### 4. Configure the infrastructure

Set up the required AWS resources, database, message broker, log storage, and networking configuration.

#### 5. Start the services

Follow `setup.md` to configure and start the components in the correct order.

> **Note:** Deplo depends on external infrastructure and service configuration. Installing the Node.js dependencies alone is not sufficient to run the complete deployment pipeline. Refer to the repository's setup instructions for the configuration requirements.

---

## Contributing

Contributions that improve deployment reliability, build isolation, log processing, documentation, or artifact routing are welcome.

1. Fork the repository.
2. Create a branch for your changes.
3. Implement and test your changes.
4. Submit a pull request describing the problem and proposed solution.

Please keep changes focused and include relevant testing or reproduction steps when possible.

---

## Author

**Shantanu Baban Kumbhirkar**

[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:shantanukumbhirkar50@gmail.com) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/shantanu1075/) [![Institute](https://img.shields.io/badge/IIIT-Manipur-00529B?style=for-the-badge&logo=googlescholar&logoColor=white)](https://www.iiitmanipur.ac.in/)