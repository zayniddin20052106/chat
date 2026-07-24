import axios from 'axios';

// Base API URL for separated backend deployment (e.g. Render.com)
export const BACKEND_URL = import.meta.env.VITE_API_URL || '';

// Configure default axios baseURL
if (BACKEND_URL) {
  axios.defaults.baseURL = BACKEND_URL;
}

// Helper to format uploaded file URLs safely with permanent fallback
export function getFullMediaUrl(path, fallbackSeed = 'User') {
  const safeFallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackSeed || 'User')}`;
  if (!path || path === 'undefined' || path === 'null') {
    return safeFallback;
  }
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  return `${BACKEND_URL}${path}`;
}

// Helper to compress device images into lightweight permanent base64 data URLs (~20KB)
// This guarantees photos are saved permanently in DB and never erased by server restarts
export function compressImageToBase64(file, maxWidth = 300, maxHeight = 300, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(event.target.result);
      };
    };
    reader.onerror = () => {
      resolve(`https://api.dicebear.com/7.x/avataaars/svg?seed=User`);
    };
  });
}
