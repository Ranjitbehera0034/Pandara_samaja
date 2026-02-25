const http = require('http');

console.log('Testing login...');

const loginData = JSON.stringify({
    membership_no: '123456789',
    mobile: '******9999'
});

const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/portal/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
}, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        console.log(`Login Status: ${res.statusCode}`);
        console.log(`Login Response: ${body}`);
        try {
            const data = JSON.parse(body);
            if (data.token) {
                testAllEndpoints(data.token, data.member._id || data.member.id);
            }
        } catch (e) { }
    });
});
req.write(loginData);
req.end();

function testAllEndpoints(token, memberId) {
    console.log(`\n\nStarting endpoint tests with token: ${token.substring(0, 20)}...`);

    const endpoints = [
        { method: 'GET', path: '/api/portal/members' },
        { method: 'POST', path: `/api/portal/subscribe/${memberId}` },
        { method: 'PUT', path: `/api/portal/members/${memberId}` },
        { method: 'POST', path: `/api/portal/members/${memberId}/photo` },
        { method: 'GET', path: '/api/portal/posts' },
        { method: 'POST', path: '/api/portal/posts' },
        { method: 'POST', path: '/api/portal/posts/123/like' },
        { method: 'POST', path: '/api/portal/posts/123/comments' },
        { method: 'DELETE', path: '/api/portal/posts/123' },
        { method: 'POST', path: '/api/portal/posts/123/report' },
        { method: 'GET', path: '/api/portal/photos' },
        { method: 'POST', path: '/api/portal/photos' },
        { method: 'DELETE', path: '/api/portal/photos/123' },
        { method: 'GET', path: '/api/portal/chat/contacts' },
        { method: 'GET', path: '/api/portal/chat/conversation/456' }
    ];

    let completed = 0;
    for (const ep of endpoints) {
        const testReq = http.request({
            hostname: 'localhost',
            port: 5000,
            path: ep.path,
            method: ep.method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let b = '';
            res.on('data', d => b += d);
            res.on('end', () => {
                console.log(`[${ep.method}] ${ep.path} -> HTTP ${res.statusCode}`);
                // console.log(`   Response: ${b}`);
                completed++;
                if (completed === endpoints.length) {
                    console.log('Done testing.');
                }
            });
        });
        if (ep.method === 'POST' || ep.method === 'PUT') {
            testReq.write(JSON.stringify({}));
        }
        testReq.end();
    }
}
