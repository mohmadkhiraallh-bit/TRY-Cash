import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import AppLayout from "./pages/app/AppLayout";
import AppHome from "./pages/app/AppHome";
import AppServices from "./pages/app/AppServices";
import AppTransactions from "./pages/app/AppTransactions";
import AppProfile from "./pages/app/AppProfile";
import AppReceive from "./pages/app/AppReceive";
import AppSend from "./pages/app/AppSend";
import AppScanner from "./pages/app/AppScanner";
import AppExchange from "./pages/app/AppExchange";
import AppSupport from "./pages/app/AppSupport";
import AppTerms from "./pages/app/AppTerms";
import AppPersonalInfo from "./pages/app/AppPersonalInfo";
import AppPasswordSecurity from "./pages/app/AppPasswordSecurity";
import { AppVerifyId, AppVerifyGuardian } from "./pages/app/AppVerify";
import AdminPanel from "./pages/app/AdminPanel";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <div className="App">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/app" element={<AppLayout />}>
                  <Route path="home" element={<AppHome />} />
                  <Route path="services" element={<AppServices />} />
                  <Route path="transactions" element={<AppTransactions />} />
                  <Route path="profile" element={<AppProfile />} />
                  <Route path="receive" element={<AppReceive />} />
                  <Route path="send" element={<AppSend />} />
                  <Route path="scanner" element={<AppScanner />} />
                  <Route path="exchange" element={<AppExchange />} />
                  <Route path="support" element={<AppSupport />} />
                  <Route path="terms" element={<AppTerms />} />
                  <Route path="personal-info" element={<AppPersonalInfo />} />
                  <Route path="password-security" element={<AppPasswordSecurity />} />
                  <Route path="verify-id" element={<AppVerifyId />} />
                  <Route path="verify-guardian" element={<AppVerifyGuardian />} />
                  <Route path="admin" element={<AdminPanel />} />
                </Route>
              </Routes>
            </BrowserRouter>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#0a0a0a",
                border: "1px solid rgba(212,175,55,0.35)",
                color: "#f1d875",
              },
            }}
          />
        </div>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
