import { useState } from "react"
import { useAuth } from "./hooks/useAuth"
import { useAccounts } from "./hooks/useAccounts"
import LoginForm from "./components/LoginForm"
import Sidebar from "./components/Sidebar"
import DashboardOverview from "./components/DashboardOverview"
import TransferForm from "./components/TransferForm"
import TransactionHistory from "./components/TransactionHistory"
import AdminConsole from "./components/AdminConsole"

/**
 * Main Application Layout
 */
export default function App() {
  const { user, loading, error, pendingEmail, login, register, verifyOtp, resendOtp, cancelOtp, logout } = useAuth()
  const accountsState = useAccounts()
  const [activeView, setActiveView] = useState("dashboard")

  // Not logged in → show login form
  if (!user) {
    return (
      <LoginForm
        onLogin={login}
        onRegister={register}
        onVerifyOtp={verifyOtp}
        onResendOtp={resendOtp}
        onCancelOtp={cancelOtp}
        pendingEmail={pendingEmail}
        loading={loading}
        error={error}
      />
    )
  }

  function handleTransferComplete() {
    // Refresh balance and history after successful transfer
    if (accountsState.selectedAccount) {
      accountsState.fetchBalance(accountsState.selectedAccount._id)
    }
  }

  function renderContent() {
    switch (activeView) {
      case "dashboard":
        return <DashboardOverview {...accountsState} />
      case "transfer":
        return (
          <TransferForm
            selectedAccount={accountsState.selectedAccount}
            onTransferComplete={handleTransferComplete}
          />
        )
      case "history":
        return <TransactionHistory selectedAccount={accountsState.selectedAccount} />
      case "admin":
        return <AdminConsole selectedAccount={accountsState.selectedAccount} />
      default:
        return <DashboardOverview {...accountsState} />
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        user={user}
        onLogout={logout}
      />
      <main className="flex-1 overflow-auto" style={{ padding: "48px 56px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
