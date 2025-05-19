import { createContext } from "react";
import { LoginCredentials } from "@shared/schema";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

// Create a default context with dummy functions
export const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {
    console.error("Auth context not initialized");
    throw new Error("Auth context not initialized");
  },
  logout: async () => {
    console.error("Auth context not initialized");
  }
};

// Create the context with a default value to avoid undefined
export const AuthContext = createContext<AuthContextType>(defaultAuthContext);