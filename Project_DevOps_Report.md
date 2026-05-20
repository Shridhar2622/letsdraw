# Doodle-Dash (LetsDraw) - Project & DevOps Architecture Report

## 1. Introduction to the Project
**Project Name:** Doodle-Dash (LetsDraw)

**Concept:** 
Doodle-Dash is a highly interactive, real-time multiplayer drawing and guessing game, inspired by popular games like Skribbl.io. Players join custom game rooms using unique avatars, take turns drawing assigned words using a robust set of canvas tools, and race against the clock to guess what the current drawer is illustrating.

**Core Mechanics & Features:**
* **Real-time Canvas Syncing:** Players see strokes, shapes, and colors exactly as they are being drawn with near-zero latency.
* **Advanced Drawing Engine:** Custom HTML5 Canvas implementation featuring continuous stroke drawing, geometric shape rendering, and a complex Flood Fill (Paint Bucket) algorithm that seamlessly identifies color boundaries.
* **Turn-based Logic:** The server manages game states, turns, timer ticks, and scoring, ensuring robust state management even if players disconnect or put the game in the background.

**Technology Stack:**
* **Frontend:** React.js (Vite), TailwindCSS, GSAP/Framer Motion (for fluid UI animations), HTML5 Canvas API, and Socket.io-client.
* **Backend:** Node.js, Express.js, and Socket.io.

---

## 2. Overview of DevOps Architecture
Modern software development requires robust CI/CD (Continuous Integration and Continuous Deployment) pipelines, cloud hosting, and containerization to ensure scalability and reliability. For Doodle-Dash, the following DevOps tools and platforms were integrated:

1. **Git & GitHub** (Version Control)
2. **GitHub Actions** (Continuous Integration)
3. **Docker & Docker Compose** (Containerization & Orchestration)
4. **Jenkins** (Enterprise Automation Server)
5. **Vercel** (Frontend Cloud Hosting)
6. **Render** (Backend Cloud Hosting)
7. **Prometheus** (Metrics & Time-Series Database)
8. **Grafana** (Observability & Data Visualization)

---

## 3. Detailed Breakdown of DevOps Tools Used

### 3.1 Git & GitHub
* **What it is:** A distributed version control system and cloud code repository.
* **Reason Used:** To maintain a strict, reliable history of all source code changes. GitHub acts as the central "single source of truth" for the application. By linking GitHub to our CI/CD pipelines, every code push is automatically captured and used to trigger automated testing and deployments.

### 3.2 GitHub Actions
* **What it is:** A cloud-based automation service deeply integrated into GitHub.
* **Reason Used:** Implemented via the `.github/workflows/ci.yml` file. Whenever code is pushed to the repository, GitHub Actions automatically spins up a virtual Ubuntu server, configures the precise Node.js environment (v20.x), installs all dependencies, and strictly tests whether both the backend and frontend can successfully compile. This acts as a security gate, preventing broken or buggy code from ever being deployed to the live servers.

### 3.3 Docker & Docker Compose
* **What it is:** Containerization technology that packages applications and their dependencies into portable, isolated environments called "Containers."
* **Reason Used:** 
  * **Dockerfiles:** We created dedicated `Dockerfile`s for both the frontend and the backend. This guarantees that the environment where the app runs is perfectly identical regardless of whether it's running on a developer's Windows laptop or a Linux production server. It completely eliminates the notorious "it works on my machine" problem.
  * **Docker Compose:** Utilized via `docker-compose.yml` to orchestrate the entire application stack locally with a single command (`docker-compose up`). It automatically manages port bindings (Port 80 for the frontend, Port 5000 for the backend) and places both containers onto a shared private network so they can communicate seamlessly.

### 3.4 Jenkins
* **What it is:** An open-source automation server designed for complex CI/CD orchestration.
* **Reason Used:** Configured via the declarative `Jenkinsfile` in the root directory. Jenkins was integrated to provide enterprise-grade pipeline capabilities. The pipeline is explicitly broken into distinct stages: fetching code, installing dependencies, building the Vite frontend, and independently compiling Docker images for both microservices. Jenkins provides a granular interface to track build metrics, artifact generation, and deployment logs.

### 3.5 Vercel
* **What it is:** A cloud platform specialized in optimizing and deploying static sites and frontend frameworks.
* **Reason Used:** The React (Vite) frontend was deployed to Vercel to take full advantage of their global Edge CDN (Content Delivery Network). Vercel automatically compresses the JavaScript bundles and serves the game interface from physical servers closest to the player's geographic location, ensuring lightning-fast load times. Additionally, we utilized a `vercel.json` configuration file to seamlessly handle React Router's single-page navigation rules.

### 3.6 Render
* **What it is:** A unified cloud provider designed for hosting dynamic backend services and databases.
* **Reason Used:** The Node.js and Socket.io backend requires a persistent, long-running server capable of maintaining hundreds of concurrent WebSocket connections. Render was selected because it natively supports Node.js web services, automatically manages SSL/HTTPS security certificates, and injects dynamic ports. It provides a highly reliable infrastructure to run the real-time multiplayer logic and data synchronization that powers the game.

### 3.7 Prometheus
* **What it is:** An open-source systems monitoring and alerting toolkit originally built at SoundCloud, designed to record real-time metrics in a highly efficient time-series database.
* **Reason Used:** In a real-time multiplayer game like Doodle-Dash, understanding server health is critical. Prometheus is configured to continuously "scrape" our Node.js backend endpoints at specified intervals, collecting deep telemetry data—such as total active WebSocket connections, round completion latency, CPU load, and memory usage—without introducing any noticeable overhead to the game loop.

### 3.8 Grafana
* **What it is:** A wildly popular, highly customizable open-source analytics and interactive visualization web application.
* **Reason Used:** While Prometheus collects the raw backend metrics, it lacks an intuitive interface. Grafana integrates directly with Prometheus to ingest that time-series data and render visually rich, live-updating dashboards. It empowers us to monitor the exact number of active drawing rooms, track concurrent players in real-time, instantly spot CPU spikes, and set up critical alerts for WebSocket drop-rates. This observability stack drastically reduces the time required to diagnose production bottlenecks.
