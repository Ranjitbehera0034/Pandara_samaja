/* assets/js/api-config.js  – load first on every page */

/* All hostnames considered “production”: */
const PROD_HOSTS = [
  'nikhilaodishapandarasamaja.in',
  'www.nikhilaodishapandarasamaja.in'
];

/* Detect environment */
const isFile   = location.protocol === 'file:';
const isLocal  = isFile || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const isProd   = PROD_HOSTS.includes(location.hostname);

/* Decide once */
if (isProd) {
  window.API_BASE_URL = 'https://pandara-samaja-backend.onrender.com';
} else {
  // covers file:// and localhost
  window.API_BASE_URL = 'http://localhost:5000';
  
}
