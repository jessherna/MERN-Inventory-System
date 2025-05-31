import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

// (Optional) If you want to attach interceptors for responses/errors,
// you can do it here. For example:
// api.interceptors.response.use(
//   response => response,
//   error => {
//     // handle certain status codes globally, e.g., token expiration
//     return Promise.reject(error);
//   }
// );

export default api;
