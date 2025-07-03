import { useAuth } from "@/context/AuthContext";
import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MainLayout from "./components/layouts/MainLayout";
import PersonalFeed from "./pages/PersonalFeed";
import ArticlesPage from "./pages/ArticlesPage";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">
          Loading authentication...
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/feed" element={<PersonalFeed />} />
            <Route path="/articles" element={<ArticlesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
