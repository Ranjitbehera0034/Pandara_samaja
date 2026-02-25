const https = require('https');

const id = '1ZqJwK1U4P_yPe6o1biCN-inz551VaO5S';

const urls = [
    `https://drive.google.com/uc?id=${id}&export=view`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
    `https://lh3.googleusercontent.com/d/${id}`,
    `https://drive.usercontent.google.com/download?id=${id}&export=view`
];

urls.forEach(url => {
    https.get(url, (res) => {
        console.log(`URL: ${url}`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers.location || 'No redirect');
        console.log('---');
    });
});
