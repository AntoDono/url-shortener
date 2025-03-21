import { AuthProvider } from "@refinedev/core";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const authProvider: AuthProvider = {
  getIdentity: async () => {
    const token = localStorage.getItem("my_access_token");
    
    const response = await fetch(`${API_URL}/session`, {
      headers: {
        Authorization: token ? `${token}` : "",
      },
    });

    if (response.status < 200 || response.status > 299) {
      return null;
    }

    const data = await response.json();

    return data;
  },
  logout: async () => {
    localStorage.removeItem("my_access_token");
    return { success: true };
  },
  // login method receives an object with all the values you've provided to the useLogin hook.
  login: async ({ email, password }) => {
    const response = await fetch(
      `${API_URL}/login`,
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (data.sessionKey) {
      localStorage.setItem("my_access_token", data.sessionKey);
      return { 
        success: true,
        redirectTo: "/links" 
      };
    }

    return { success: false };
  },
  check: async () => {
    const token = localStorage.getItem("my_access_token");

    return { authenticated: Boolean(token) };
  },
  onError: async (error) => {
    throw new Error("Not implemented");
  },
  // optional methods
  register: async (params) => {
    throw new Error("Not implemented");
  },
  forgotPassword: async (params) => {
    throw new Error("Not implemented");
  },
  updatePassword: async (params) => {
    throw new Error("Not implemented");
  },
  getPermissions: async () => {
    throw new Error("Not implemented");
  },
};