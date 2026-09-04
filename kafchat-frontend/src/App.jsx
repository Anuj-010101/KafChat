import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { CallProvider } from "./context/CallContext";
import { StatusProvider } from "./context/StatusContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import CallLayer from "./components/call/CallLayer";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuth } from "./hooks/useAuth";

// Keeps a logged-in user from seeing the auth screen again
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route
      path="/auth"
      element={
        <PublicOnlyRoute>
          <AuthPage />
        </PublicOnlyRoute>
      }
    />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <ChatProvider>
            <CallProvider>
              <StatusProvider>
                <DashboardPage />
                <CallLayer />
              </StatusProvider>
            </CallProvider>
          </ChatProvider>
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

const App = () => (
  <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#121319",
              color: "#ECEAE3",
              border: "1px solid #252833",
              fontSize: "13px",
            },
            success: { iconTheme: { primary: "#0284C7", secondary: "#121319" } },
            error: { iconTheme: { primary: "#F16063", secondary: "#121319" } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;