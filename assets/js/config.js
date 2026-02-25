/* assets/js/api-config.js  – load first on every page */

const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:';

window.API_BASE_URL = isLocal ? 'http://localhost:5000' : 'https://pandara-samaja-backend.onrender.com';
