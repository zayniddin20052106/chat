import axios from 'axios';

// Base API URL for separated backend deployment (e.g. Render.com)
export const BACKEND_URL = import.meta.env.VITE_API_URL || '';

// Configure default axios baseURL
if (BACKEND_URL) {
  axios.defaults.baseURL = BACKEND_URL;
}

// Helper to format uploaded file URLs
export function getFullMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  return `${BACKEND_URL}${path}`;
}
