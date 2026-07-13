import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Automatically attach the JWT token (if we have one) to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;