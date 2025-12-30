const http = require('http');

console.log('Running direct server test...');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/test',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const data = JSON.stringify({
  test: 'Hello from test script'
});

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    testAuthRegister();
  });
});

req.on('error', (e) => {
  console.error(`Problem with test request: ${e.message}`);
});

req.write(data);
req.end();

function testAuthRegister() {
  console.log('\nTesting auth/register endpoint...');
  
  const authOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const authData = JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  });

  const authReq = http.request(authOptions, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', responseData);
    });
  });

  authReq.on('error', (e) => {
    console.error(`Problem with auth request: ${e.message}`);
  });

  authReq.write(authData);
  authReq.end();
}

//need to check end to end test 
