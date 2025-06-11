// assets/js/config.js

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_BASE_URL = isLocalhost
  ? 'http://localhost:5000'
  : 'https://pandara-samaja-backend.onrender.com';

export { API_BASE_URL };
