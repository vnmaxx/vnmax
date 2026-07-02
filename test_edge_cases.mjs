import { SignJWT } from 'jose';
import { jwtVerify } from 'jose';
import crypto from 'crypto';

const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'P-256'
});

async function testEdgeCases() {
  const now = Math.floor(Date.now() / 1000);
  
  // Case 1: Token with NO exp claim
  console.log('Test 1: Token with NO exp claim');
  const noExpToken = await new SignJWT({ 
    data: 'test'
  })
    .setProtectedHeader({ alg: 'ES256' })
    .sign(privateKey);
  
  try {
    const result = await jwtVerify(noExpToken, publicKey);
    console.log('✓ Token without exp accepted (this is the default jose behavior)');
    console.log('  Payload:', result.payload);
  } catch (err) {
    console.log('Error:', err.message);
  }
  
  // Case 2: Expired token with clock skew (1 second ago, testing default behavior)
  console.log('\nTest 2: Token expired 1 second ago (default tolerance=0)');
  const justExpiredToken = await new SignJWT({ 
    data: 'test',
    exp: now - 1
  })
    .setProtectedHeader({ alg: 'ES256' })
    .sign(privateKey);
  
  try {
    const result = await jwtVerify(justExpiredToken, publicKey);
    console.log('Token accepted');
  } catch (err) {
    console.log('✓ Token rejected:', err.code);
  }
  
  // Case 3: Same token with clockTolerance=5
  console.log('\nTest 3: Same token with clockTolerance=5');
  try {
    const result = await jwtVerify(justExpiredToken, publicKey, { clockTolerance: 5 });
    console.log('✓ Token accepted with 5-second tolerance');
  } catch (err) {
    console.log('Error:', err.message);
  }
}

testEdgeCases();
