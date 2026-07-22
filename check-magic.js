const https = require('https');

https.get('https://solebz.onrender.com/api/v1/file/20829a5a324b48d19d757d395b410f74', {
  headers: { "x-api-key": "solebz_benimsifrem_123" }
}, (res) => {
  res.on('data', (chunk) => {
    const hex = chunk.slice(0, 16).toString('hex');
    const ascii = chunk.slice(0, 16).toString('ascii');
    console.log('HEX:', hex);
    console.log('ASCII:', ascii.replace(/[^ -~]/g, '.'));
    process.exit(0);
  });
});
