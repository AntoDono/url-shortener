import { AuthProvider } from "@refinedev/core";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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

    if (response.status === 403 && data.error === 'Please verify your email before logging in') {
      return {
        success: false,
        error: {
          message: "Please check your email to verify your account before logging in.",
          name: "Email Not Verified",
        },
      };
    }

    if (data.sessionKey) {
      localStorage.setItem("my_access_token", data.sessionKey);
      return { 
        success: true,
        redirectTo: "/links" 
      };
    }

    return { 
      success: false,
      error: {
        message: data.error || "Login failed",
        name: "Login Error",
      },
    };
  },
  check: async () => {
    const token = localStorage.getItem("my_access_token");

    if (!token) {
      return { authenticated: false };
    }

    // gets the session
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
        message: "Please check your email to verify your account before logging in.",
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
    const { email } = params;
    
    const response = await fetch(
      `${API_URL}/forgot-password`,
      {
        method: "POST",
        body: JSON.stringify({ email }),
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
        message: data.message,
      };
    }
    
    return {
      success: false,
      error: {
        message: data.error || "Failed to send reset instructions",
        name: "Forgot Password Error",
      },
    };
  },
  updatePassword: async (params) => {
    const { token, password } = params;
    
    const response = await fetch(
      `${API_URL}/reset-password`,
      {
        method: "POST",
        body: JSON.stringify({ token, password }),
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
        message: data.message,
      };
    }
    
    return {
      success: false,
      error: {
        message: data.error || "Failed to reset password",
        name: "Reset Password Error",
      },
    };
  },
  getPermissions: async () => {
    throw new Error("Not implemented");
  },
};