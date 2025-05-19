import { useState, useEffect, ReactNode, useContext } from "react";
import { apiRequest } from "@/lib/api";
import { LoginCredentials } from "@shared/schema";
import { useLocation as useWouterLocation } from "wouter";
import { AuthContext, AuthContextType } from "@/lib/auth-context";

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useWouterLocation();

  const isAuthenticated = !!user;

  useEffect(() => {
    let isMounted = true;
    
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/session");
        const data = await response.json();
        
        if (isMounted && data.isAuthenticated && data.user) {
          // Fetch full user details
          const userResponse = await apiRequest("GET", `/api/users/${data.user.id}`);
          const userData = await userResponse.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
    
    // Cleanup function to handle component unmounting
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      const userData = await response.json();
      setUser(userData);
      setLocation("/dashboard");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
      setLocation("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create the context value object
  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using authentication throughout the application
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
