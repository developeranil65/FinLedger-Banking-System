import axios from "axios"

/**
 * Axios Instance
 * ──────────────
 * Centralizes all HTTP config in one place:
 *   - baseURL points to the Vite proxy (/api → localhost:3000)
 *   - withCredentials sends cookies (JWT) with every request
 *   - Interceptor attaches the Bearer token from localStorage
 */
const api = axios.create({
    baseURL: "/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
})

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor — handle 401 (expired token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || ""
        const isAuthRoute = url.startsWith("/auth/")
        if (error.response?.status === 401 && !isAuthRoute) {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            window.location.href = "/"
        }
        return Promise.reject(error)
    }
)

export default api
