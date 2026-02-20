export default function Sidebar({ activeView, setActiveView, user, onLogout }) {
    const navItems = [
        { id: "dashboard", label: "Dashboard" },
        { id: "transfer", label: "Transfer" },
        { id: "history", label: "History" },
        { id: "admin", label: "Admin Console" },
    ]

    const initials = (user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()

    return (
        <aside
            className="flex flex-col"
            style={{
                width: "280px",
                minHeight: "100vh",
                background: "var(--color-surface-card)",
                borderRight: "1px solid var(--color-border)"
            }}
        >
            {/* Brand header */}
            <div
                style={{
                    padding: "32px 32px 28px",
                    borderBottom: "1px solid var(--color-border)"
                }}
            >
                <h1
                    style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        letterSpacing: "-0.02em"
                    }}
                >
                    FinLedger
                </h1>
                <p
                    style={{
                        fontSize: "13px",
                        color: "var(--color-text-secondary)",
                        marginTop: "4px"
                    }}
                >
                    Banking Dashboard
                </p>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: "28px 20px" }}>
                <p
                    style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--color-text-secondary)",
                        padding: "0 16px",
                        marginBottom: "16px"
                    }}
                >
                    Navigation
                </p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {navItems.map((item) => {
                        const isActive = activeView === item.id
                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => setActiveView(item.id)}
                                    style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "14px 20px",
                                        borderRadius: "14px",
                                        fontSize: "14px",
                                        fontWeight: isActive ? 600 : 500,
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        border: "none",
                                        background: isActive ? "rgba(79,110,247,0.12)" : "transparent",
                                        color: isActive ? "var(--color-primary-light)" : "var(--color-text-secondary)",
                                        borderLeft: isActive ? "3px solid var(--color-primary)" : "3px solid transparent",
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = "rgba(255,255,255,0.03)"
                                            e.currentTarget.style.color = "var(--color-text-primary)"
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = "transparent"
                                            e.currentTarget.style.color = "var(--color-text-secondary)"
                                        }
                                    }}
                                >
                                    {item.label}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* User section */}
            <div
                style={{
                    padding: "20px",
                    borderTop: "1px solid var(--color-border)"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "16px",
                        marginBottom: "8px",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.02)"
                    }}
                >
                    <div
                        style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "15px",
                            fontWeight: 700,
                            flexShrink: 0,
                            background: "linear-gradient(135deg, rgba(79,110,247,0.25), rgba(59,93,231,0.25))",
                            color: "var(--color-primary-light)",
                            border: "1px solid rgba(79,110,247,0.3)"
                        }}
                    >
                        {initials}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                            style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "var(--color-text-primary)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                            }}
                        >
                            {user?.name || "User"}
                        </p>
                        <p
                            style={{
                                fontSize: "12px",
                                color: "var(--color-text-secondary)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                            }}
                        >
                            {user?.email}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    style={{
                        width: "100%",
                        padding: "14px 20px",
                        borderRadius: "14px",
                        fontSize: "14px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        border: "none",
                        background: "transparent",
                        color: "var(--color-danger)",
                        textAlign: "left"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
