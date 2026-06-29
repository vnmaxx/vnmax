const https = require('https');

// Token lido do ambiente — NUNCA commitar credenciais em texto puro.
// Defina antes de rodar:  set VERCEL_API_KEY=...  (cmd)  |  $env:VERCEL_API_KEY="..."  (PowerShell)
const VERCEL_API_KEY = process.env.VERCEL_API_KEY;
const TEAM_ID = 'changzaoos-projects';

if (!VERCEL_API_KEY) {
    console.error('Defina a variavel de ambiente VERCEL_API_KEY antes de rodar.');
    process.exit(1);
}

function addDomain(domain) {
    const postData = JSON.stringify({
        name: domain,
        gitForkable: true
    });

    const options = {
        hostname: 'api.vercel.com',
        path: `/v6/domains`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${VERCEL_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            console.log('Response:', data);
        });
    });

    req.on('error', (error) => {
        console.error('Error:', error);
    });

    req.write(postData);
    req.end();
}

addDomain('vnmax.org');