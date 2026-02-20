# Frontend Ledger Application

A modern Single Page Application (SPA) built with React and Vite for the FinLedger banking platform. It features secure authentication, real-time transaction history, and an intuitive user interface.

## Technology Stack

*   **Framework**: React (v18)
*   **Build Tool**: Vite (Extremely fast HMR and optimized builds)
*   **Styling**: Customized CSS and Tailwind-like utility classes
*   **Routing**: React Router DOM (v6)
*   **State Management**: React Context API & Custom Hooks
*   **HTTP Client**: Axios (configured with interceptors for JWT handling)

## Deployment

The application is containerized using Docker.

1.  **Build Phase**: Vite compiles the React code into static assets (`dist/`).
2.  **Serve Phase**: Nginx (Alpine) serves the static assets and handles routing.

### Nginx Configuration

The custom `nginx.conf` handles:
*   SPA Routing (redirects all unrelated paths to `index.html`)
*   Gzip Compression (for performance optimization)
*   API Proxying (forwarding `/api/*` requests to the backend service)
    *   *Note: In production environments like AWS ECS, this proxy configuration may be superseded by an Application Load Balancer (ALB).*

## Local Development

Ensure you have Node.js installed.

1.  **Install Dependencies**:
    ```bash
    npm install
    # or
    npm ci
    ```

2.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

3.  **Build for Production**:
    ```bash
    npm run build
    ```
    The output will be in the `dist` directory.

## Testing

Run unit tests (future implementation):
```bash
npm test
```

## Linting

Ensure code quality:
```bash
npm run lint
```
