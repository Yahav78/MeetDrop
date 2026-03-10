const http = require('http');

setTimeout(() => {
    console.error("Timeout after 5 seconds");
    process.exit(1);
}, 5000);

const data = JSON.stringify({
    username: "test",
    password: "password"
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);

    let body = '';
    res.on('data', d => {
        body += d;
    });

    res.on('end', () => {
        console.log(body);
        process.exit(0);
    });
});

req.on('error', error => {
    console.error('Request error:', error);
    process.exit(1);
});

req.write(data);
req.end();
