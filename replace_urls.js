const fs = require('fs');
const path = require('path');

const API_CONFIG = `
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
export const API_BASE_URL = isLocal ? 'http://localhost:5000/api' : 'https://pandara-samaja-backend.onrender.com/api';
export const ROOT_URL = isLocal ? 'http://localhost:5000' : 'https://pandara-samaja-backend.onrender.com';
`;

function processDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // Replace manual localhost logic with imported logic? 
            // It's safer to just replace 'http://localhost:5000/api' and 'http://localhost:5000' with variables.
            // But adding imports to every file can be tricky with different depths.

            // An easier inline replacement for portal-app that doesn't need imports:
            if (fullPath.includes('portal-app')) {
                let changed = false;

                // Remove existing constant definitions
                if (content.match(/const\s+API_BASE_URL\s*=\s*['"]http:\/\/localhost:5000\/api\/portal['"];?/g)) {
                    content = content.replace(/const\s+API_BASE_URL\s*=\s*['"]http:\/\/localhost:5000\/api\/portal['"];?/g, `const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api/portal' : 'https://pandara-samaja-backend.onrender.com/api/portal';`);
                    changed = true;
                }

                if (content.match(/const\s+API_BASE_URL\s*=\s*['"]http:\/\/localhost:5000\/api['"];?/g)) {
                    content = content.replace(/const\s+API_BASE_URL\s*=\s*['"]http:\/\/localhost:5000\/api['"];?/g, `const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api' : 'https://pandara-samaja-backend.onrender.com/api';`);
                    changed = true;
                }

                if (content.match(/const\s+SOCKET_URL\s*=\s*['"]http:\/\/localhost:5000['"];?/g)) {
                    content = content.replace(/const\s+SOCKET_URL\s*=\s*['"]http:\/\/localhost:5000['"];?/g, `const SOCKET_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000' : 'https://pandara-samaja-backend.onrender.com';`);
                    changed = true;
                }

                if (content.includes("'http://localhost:5000/api/portal")) {
                    content = content.replace(/'http:\/\/localhost:5000\/api\/portal/g, "((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api/portal' : 'https://pandara-samaja-backend.onrender.com/api/portal') + '");
                    changed = true;
                }

                if (content.includes("\`http://localhost:5000/api/portal")) {
                    content = content.replace(/\`http:\/\/localhost:5000\/api\/portal/g, "\`${(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api/portal' : 'https://pandara-samaja-backend.onrender.com/api/portal'}/");
                    // Fix double slashes mapping if injected right before string interpolation
                    content = content.replace(/portal\/\/\//g, "portal/");
                    content = content.replace(/portal\//g, "portal/"); // normalize
                    changed = true;
                }

                // Base localhost for images
                if (content.includes("\`http://localhost:5000")) {
                    content = content.replace(/\`http:\/\/localhost:5000/g, "\`${(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000' : 'https://pandara-samaja-backend.onrender.com'}/");
                    content = content.replace(/\.com\/\//g, ".com/").replace(/5000\/\//g, "5000/");
                    changed = true;
                }

                if (content.includes('"http://localhost:5000"')) {
                    content = content.replace(/"http:\/\/localhost:5000"/g, "(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000' : 'https://pandara-samaja-backend.onrender.com'");
                    changed = true;
                }

                if (changed) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log("Updated", fullPath);
                }
            } else if (fullPath.includes('admin-app')) {
                let changed = false;
                if (content.includes('\`http://localhost:5000')) {
                    content = content.replace(/\`http:\/\/localhost:5000/g, "\`${(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000' : 'https://pandara-samaja-backend.onrender.com'}/");
                    content = content.replace(/\.com\/\//g, ".com/").replace(/5000\/\//g, "5000/");
                    changed = true;
                }
                if (changed) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log("Updated admin file", fullPath);
                }
            }
        }
    });
}

processDir('/Users/ranjit/Downloads/Pandara_samaja/portal-app/src');
processDir('/Users/ranjit/Downloads/Pandara_samaja/admin-app/src/pages');
