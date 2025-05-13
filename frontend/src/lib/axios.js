import axios from "axios";

// Backend URL
const EXPRESS_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api";

// Main axios instance - points to Express backend for all endpoints
export const axiosInstance = axios.create({
  baseURL: EXPRESS_BASE_URL,
  withCredentials: true, // send cookies with the request
});
