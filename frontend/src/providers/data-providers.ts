import { DataProvider } from "@refinedev/core";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  const token = localStorage.getItem("my_access_token");
  if (token) {
    headers["Authorization"] = token;
  }
  
  return headers;
};

const dataProvider: DataProvider = {
  // required methods
  getList: async ({ resource, pagination, sorters, filters, meta }) => {
    const url = `${API_URL}/${resource}`;
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    const data = await response.json();
    
    return {
      data,
      total: data.length,
    };
  },
  
  create: async ({ resource, variables, meta }) => {
    const url = `${API_URL}/${resource}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(variables),
    });
    
    const data = await response.json();
    
    return {
      data,
    };
  },
  
  update: async ({ resource, id, variables, meta }) => {
    const url = `${API_URL}/${resource}/${id}`;
    
    const response = await fetch(url, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(variables),
    });
    
    const data = await response.json();
    
    return {
      data,
    };
  },
  
  deleteOne: async ({ resource, id, variables, meta }) => {
    const url = `${API_URL}/${resource}/${id}`;
    
    const response = await fetch(url, {
      method: "DELETE",
      headers: getHeaders(),
    });
    
    const data = await response.json();
    
    return {
      data,
    };
  },
  
  getOne: async ({ resource, id, meta }) => {
    const url = `${API_URL}/${resource}/${id}`;
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    const data = await response.json();
    
    return {
      data,
    };
  },

  getApiUrl: () => API_URL,
  
  // optional methods
  getMany: async ({ resource, ids, meta }) => {
    const params = ids.map((id) => `id=${id}`).join("&");
    const url = `${API_URL}/${resource}?${params}`;
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    const data = await response.json();
    
    return {
      data,
    };
  },
  
  createMany: async ({ resource, variables, meta }) => {
    const url = `${API_URL}/${resource}/bulk`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(variables),
    });
    
    const data = await response.json();
    
    return {
      data,
    };
  },
  
  deleteMany: async ({ resource, ids, variables, meta }) => {
    const params = ids.map((id) => `id=${id}`).join("&");
    const url = `${API_URL}/${resource}/bulk?${params}`;
    
    const response = await fetch(url, {
      method: "DELETE",
      headers: getHeaders(),
    });
    
    const data = await response.json();
    
    return {
      data,
    };
  },
  
  updateMany: async ({ resource, ids, variables, meta }) => {
    const params = ids.map((id) => `id=${id}`).join("&");
    const url = `${API_URL}/${resource}/bulk?${params}`;
    
    const response = await fetch(url, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(variables),
    });
    
    const data = await response.json();
    
    return {
      data,
    };
  },
  
  custom: async ({ url, method, filters, sorters, payload, query, headers, meta }) => {
    const requestUrl = `${API_URL}${url}`;
    
    const requestHeaders = {
      ...getHeaders(),
      ...headers,
    };
    
    const response = await fetch(requestUrl, {
      method: method || "GET",
      headers: requestHeaders,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    
    const data = await response.json();
    
    return {
      data,
    };
  },
};

export default dataProvider;