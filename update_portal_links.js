const fs = require('fs');
const path = require('path');

const files = ['index.html', 'about.html', 'members.html', 'matrimony.html', 'blogs.html'];

files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');

        if (content.includes('href="http://localhost:5173"')) {
            content = content.replace(/href="http:\/\/localhost:5173"/g, 'href="portal/"');
            content = content.replace(/href="portal\/"\s+target="_blank"/g, 'href="portal/"');
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`Updated ${file}`);
        }
    }
});

const portalOld = path.join(__dirname, 'portal.html');
if (fs.existsSync(portalOld)) {
    let content = fs.readFileSync(portalOld, 'utf8');
    if (content.includes('href="portal.html"')) {
        content = content.replace(/href="portal\.html"/g, 'href="portal/"');
        fs.writeFileSync(portalOld, content, 'utf8');
        console.log(`Updated portal.html`);
    }
}
