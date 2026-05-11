// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: "student" | "admin" | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<"student" | "admin" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync("token");
      const storedUser = await AsyncStorage.getItem("user");

      if (storedToken && storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setRole(parsedUser.role);
      }
    } catch (error) {
      console.error("Error loading auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, newUser: User) => {
    await SecureStore.setItemAsync("token", newToken);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setRole(newUser.role);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    await AsyncStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};