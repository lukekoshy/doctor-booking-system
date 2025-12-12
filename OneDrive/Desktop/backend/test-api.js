// Test the API
const http = require('http');

function makeRequest(path) {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:4000' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${path}`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response: ${data}\n`);
        resolve();
      });
    });
    req.on('error', (err) => {
      console.log(`❌ ${path}`);
      console.log(`   Error: ${err.message}\n`);
      resolve();
    });
  });
}

async function test() {
  console.log('Testing Backend API...\n');
  await makeRequest('/health');
  await makeRequest('/api/slots');
  console.log('Test complete!');
  process.exit(0);
}

setTimeout(test, 1000);
