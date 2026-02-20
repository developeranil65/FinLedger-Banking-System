# Banking System (FinLedger)

A secure, scalable banking infrastructure built with a microservices-ready architecture using Node.js, Express, MongoDB, and React. This application handles user authentication (OTP verification), account management, transactions, and admin controls.

## Architecture

The system is designed for high availability and scalability, deployed on AWS using ECS Fargate.

![Architecture Diagram](https://placeholder-image-url.com/architecture-diagram.png)

### Core Components

*   **Frontend**: React (Vite) Single Page Application served via Nginx.
*   **Backend**: Node.js/Express API running in a distroless container.
*   **Database**: MongoDB (Atlas or self-hosted).
*   **Authentication**: JWT with secure HTTP-only cookies and Google OAuth integration.
*   **CI/CD**: Github -> AWS CodePipeline -> AWS CodeBuild -> Amazon ECR -> Amazon ECS (Fargate).

---

## Deployment Strategy

We utilize a modern CI/CD pipeline for automated deployments to AWS.

### Continuous Integration & Delivery (CI/CD)

The pipeline is triggered on every push to the `main` branch.

1.  **Source**: GitHub repository triggers AWS CodePipeline.
2.  **Build**: AWS CodeBuild runs the `buildspec.yml`:
    *   Builds Docker images for Frontend and Backend.
    *   pushes images to Amazon ECR (Elastic Container Registry).
3.  **Deploy**: AWS CodeDeploy updates the ECS Fargate Service with the new image definitions.

![Deployment Pipeline](./public/cicd%20arch.png)

### Infrastructure Prerequisites

*   AWS ECS Cluster (Fargate)
*   Application Load Balancer (ALB)
*   MongoDB Cluster
*   Redis (optional, for caching/session management)

---

## Local Development Setup

### Prerequisites

*   Node.js (v18+)
*   Docker & Docker Compose
*   MongoDB (local or Atlas URI)

### Quick Start

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd banking-system
    ```

2.  **Environment Configuration**:
    Create a `.env` file in `Backend-Ledger` based on `.env.example`.

    ```env
    PORT=3000
    MONGO_URI=mongodb://mongo:27017/banking-system
    JWT_SECRET=your_jwt_secret
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_email_password
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    ```

3.  **Run with Docker Compose**:
    ```bash
    docker compose up --build
    ```

    *   Frontend: `http://localhost:5173`
    *   Backend API: `http://localhost:3000`

---

## Future Enhancements (v2 Roadmap)

The next version will focus on performance optimization and third-party integrations.

*   **Load Testing**: Implementation of K6 scripts to stress test the transaction endpoints.
*   **Third-Party Webhooks**: Mock service integration for payment gateways (e.g., Paytm, Stripe) to simulate real-world financial flows.
*   **Advanced Analytics**: Integration with ELK Stack for log aggregation and visualization.

---

## License

- Private Repository
- All rights reserved
