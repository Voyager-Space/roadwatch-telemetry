# 🌍 RoadWatch Intelligence

> **An Edge-to-Cloud Telemetry Ingestion & Geospatial Analytics Platform**

RoadWatch is a full-stack, distributed system designed to process high-frequency hardware telemetry in real-time. It ingests spatial vibration data from embedded edge nodes, applies algorithmic clustering to identify road anomalies (potholes), and broadcasts the processed intelligence to a live web dashboard via WebSockets.

## 🚀 System Architecture

The pipeline is built to handle noisy, high-throughput data streams, filtering out false positives at the edge and clustering valid data points in the cloud.

1. **Edge Nodes (Embedded C++):** Custom ESP32 units equipped with MPU6500 IMUs and NEO-M6 GPS modules. Uses moving-average baseline calculations and threshold algorithms to detect valid impacts while rejecting ambient road vibration.
2. **Telemetry Bridge (Python):** A lightweight ingestion script that reads raw JSON packets from an nRF24L01+ radio gateway via a serial COM interface and pipes them to the backend API via HTTP POST.
3. **Ingestion Engine (NestJS):** The backend core. Utilizes **PostGIS (`ST_DWithin`)** to perform spatial queries, clustering new impact events into existing pothole records within a defined radius to prevent database bloat.
4. **AI Summarization (Gemini 1.5):** Generates automated, civil-engineering-focused maintenance reports and risk assessments based on aggregated impact severity scores.
5. **Real-Time Client (Next.js):** A React-based dashboard featuring a live Leaflet map and Recharts analytics, driven by a JWT-authenticated WebSocket connection for sub-second UI updates.

---

## 🏗️ Repository Structure

This project is managed as a **Turborepo** monorepo to cleanly separate concerns between the frontend, backend, and shared utilities.

| Directory | Description |
| :--- | :--- |
| `apps/backend/` | NestJS server, Prisma ORM, PostgreSQL/PostGIS integration, WebSocket Gateway. |
| `apps/frontend/` | Next.js 14 (App Router) client, TailwindCSS, Live Map Dashboard. |
| `packages/shared-types/` | Universal TypeScript interfaces (DTOs, Enums) shared across the stack. |
| `packages/shared-utils/` | Shared algorithmic logic (G-force calculation, confidence scoring). |
| `packages/ui-components/` | Custom, reusable React UI components. |
| `telemetry_bridge.py` | Python serial-to-HTTP ingestion script for hardware integration. |

---

## ⚙️ Core Technical Highlights

* **Algorithmic Filtering:** Implemented a continuous moving-average filter and debounce logic on the edge nodes to sanitize accelerometer data before transmission.
* **Geospatial Clustering:** Raw telemetry is cross-referenced against active database records using spatial mathematics (`ST_MakePoint`, `ST_Distance`) to merge multiple hits into single, high-confidence anomalies.
* **Type-Safe Monorepo:** End-to-end type safety. The exact DTOs used by the NestJS ingestion controller are imported directly by the Next.js frontend.
* **Role-Based Access Control (RBAC):** JWT-secured endpoints and WebSocket connections, ensuring only authorized engineering staff can trigger AI summaries or change maintenance statuses.

---

## 🛠️ Local Development Setup

### Prerequisites
* Node.js (v18+)
* Yarn (v1.22+)
* Python 3.10+ (for hardware bridge)
* Docker & Docker Compose (for PostgreSQL/PostGIS DB)

### 1. Bootstrapping the Environment
Clone the repository and install the monorepo dependencies:
```bash
git clone [https://github.com/Voyager-Space/roadwatch-telemetry.git](https://github.com/Voyager-Space/roadwatch-telemetry.git)
cd roadwatch-telemetry
yarn install
