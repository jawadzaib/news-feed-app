import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import api, { authApi } from "@/api/axios";
import { User } from "@/types/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("authToken")
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [loading, setLoading] = useState<boolean>(true);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("authToken", newToken);
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout failed on backend:", error);
    } finally {
      localStorage.removeItem("authToken");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await api.get("/sanctum/csrf-cookie");

        if (token) {
          try {
            const response = await authApi.fetchUser();
            setUser(response.data);
            setIsAuthenticated(true);
          } catch (error) {
            console.error("Failed to fetch user data with token:", error);
            logout();
          }
        }
      } catch (error) {
        console.error("Failed to fetch CSRF cookie or initialize auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [token]);

  // avoid unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      login,
      logout,
      loading,
    }),
    [user, token, isAuthenticated, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
