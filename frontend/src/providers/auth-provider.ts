import { AuthProvider } from "@refinedev/core";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Helper function to get headers with authorization
const getAuthHeaders = () => {
  const token = localStorage.getItem("my_access_token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `${token}` : "",
  };
};

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
    const response = await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

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

    if (!token) {
      return { authenticated: false };
    }

    // Verify token is still valid by checking session
    const response = await fetch(`${API_URL}/session`, {
      headers: {
        Authorization: token,
      },
    });

    if (response.status < 200 || response.status > 299) {
      localStorage.removeItem("my_access_token");
      return { authenticated: false };
    }

    return { authenticated: true };
  },
  onError: async (error) => {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem("my_access_token");
      return {
        logout: true,
        redirectTo: "/login",
        error,
      };
    }

    return { error };
  },
  // optional methods
  register: async (params) => {
    const { email, password } = params;
    
    const response = await fetch(
      `${API_URL}/signup`,
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        redirectTo: "/login",
      };
    }
    
    return {
      success: false,
      error: {
        message: data.error || "Registration failed",
        name: "Register Error",
      },
    };
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