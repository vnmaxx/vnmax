const https = require('https');

const VERCEL_API_KEY = 'vc_8IhPlHS9ufe4qxWr568kMWNpHz6bh0q3ij2y8SO1KZurqnBCxF2mQxiB';
const TEAM_ID = 'changzaoos-projects';

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