# DevOps Implementation Presentation Guide: LETSDRAW

This document serves as your guide and script for presenting the DevOps architecture of the **LETSDRAW** multiplayer drawing game. It explains **What** each tool is, **Why** it was used, and **How** it was implemented in this specific project.

---

## 1. Introduction: Why DevOps?

**The Problem:** Building a multiplayer game with a React frontend and a Node.js backend means dealing with two separate environments, managing dependencies, running different start commands, and hoping the code works the same way on a deployment server as it does on a local laptop.

**The Solution:** We implemented a modern **DevOps CI/CD Pipeline**. This automates the building, testing, and deployment of the application, ensuring consistency, reliability, and speed.

Our DevOps stack consists of three main pillars:
1.  **Docker & Docker Compose** (Containerization & Orchestration)
2.  **GitHub Actions** (Continuous Integration)
3.  **Jenkins** (Complete CI/CD Pipeline Automation)

---

## 2. Containerization (Docker)

### What is it?
Docker is a platform that packages an application and all its dependencies (libraries, runtime, configuration) into a standardized unit called a **container**.

### Why did we use it?
*   **"It works on my machine" guarantee:** A Docker container runs exactly the same way on a developer's laptop as it does on a production cloud server.
*   **Isolation:** The frontend and backend run in isolated environments without interfering with each other's dependencies.
*   **Ease of Deployment:** Instead of installing Node.js and Nginx on a server manually, we just tell the server to run our Docker containers.

### How was it implemented?
We created two distinct `Dockerfiles` and one orchestration file:

1.  **Backend Dockerfile (`backend/Dockerfile`):**
    *   Uses a lightweight Alpine Linux image with Node.js.
    *   Copies the `package.json`, installs production dependencies, and exposes port `5000`.
    *   Starts the Socket.IO server.
2.  **Frontend Multi-Stage Dockerfile (`frontend/Dockerfile`):**
    *   **Stage 1 (Builder):** Uses Node.js to install dependencies and run `npm run build`. This compiles the React/Vite code into optimized static HTML/CSS/JS files.
    *   **Stage 2 (Server):** Uses **Nginx** (a highly efficient web server). It throws away the heavy Node.js environment and *only* copies the optimized static files from Stage 1. This makes the final container incredibly small, fast, and secure.
3.  **Orchestration (`docker-compose.yml`):**
    *   Instead of running containers one by one, `docker-compose` defines our entire system (frontend and backend) as a single service.
    *   It handles network routing and port mapping (e.g., mapping port 80 to the frontend).
    *   With one single command (`docker-compose up --build`), the entire multiplayer game boots up.

---

## 3. Continuous Integration (GitHub Actions)

### What is it?
Continuous Integration (CI) is the practice of automatically integrating code changes into a shared repository frequently, where automated builds and tests run immediately. GitHub Actions is a CI tool built directly into GitHub.

### Why did we use it?
*   **Quality Assurance:** To prevent broken code from being merged into the `master` branch.
*   **Immediate Feedback:** If a developer pushes code that breaks the React build or has missing dependencies, the team is notified immediately via a failed action log.

### How was it implemented?
*   We created a YAML workflow file: `.github/workflows/ci.yml`.
*   **Triggers:** It is configured to run automatically on any `push` or `pull_request` to the `master` branch.
*   **The Workflow:** 
    1. It spins up a fresh, temporary Ubuntu server in the cloud.
    2. It checks out the latest code.
    3. It installs Node.js.
    4. It navigates to the `/backend` folder and runs `npm install` to check for dependency errors.
    5. It navigates to the `/frontend` folder, installs dependencies, and runs `npm run build`. If the React code fails to compile, the Action fails, protecting the master branch.

---

## 4. Complete CI/CD Pipeline (Jenkins)

### What is it?
Jenkins is the industry-standard, open-source automation server used to build comprehensive Continuous Integration and Continuous Deployment (CI/CD) pipelines.

### Why did we use it?
While GitHub Actions is great for basic checks, Jenkins provides a robust, enterprise-grade platform for defining complex pipelines, archiving artifacts, managing credentials, and deploying containers to production servers.

### How was it implemented?
We defined our pipeline using "Pipeline as Code" via a `Jenkinsfile` written in Groovy syntax. This file outlines a strict, 5-stage automated process:

1.  **Checkout:** Connects to the Git repository and pulls the latest source code.
2.  **Install Backend Dependencies:** Executes shell commands (`sh`) to install Node.js packages for the backend.
3.  **Install & Build Frontend:** Executes shell commands to compile the React application.
4.  **Docker Build Frontend:** Instructs the Jenkins server's Docker engine to build the frontend Docker image (`letsdraw-frontend`) based on the multi-stage Dockerfile.
5.  **Docker Build Backend:** Instructs the Docker engine to build the backend Docker image (`letsdraw-backend`).

**Post-Build Actions:** The pipeline includes logic to echo success or failure messages, which in a real-world scenario would send an email or Slack notification to the DevOps team.

---

## 💡 Tips for the Presentation
*   **Speak confidently about the "Multi-stage build"** in the frontend. Professors love this concept because it shows you understand how to optimize container sizes for production (using Nginx instead of a bulky Node server).
*   **Highlight Automation:** Emphasize that because of GitHub Actions and Jenkins, human error is drastically reduced. No one has to manually type `npm install` on the server anymore.
*   **Show, Don't Just Tell:** If you can, show the GitHub Actions tab with a "Green Checkmark" proving the pipeline passed, or show the `docker-compose up` command bringing up both servers instantly.
