import { SignJWT } from 'jose';
import { jwtVerify } from 'jose';
import crypto from 'crypto';

const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'P-256'
});

async function testExpValidation() {
  const now = Math.floor(Date.now() / 1000);
  
  const expiredToken = await new SignJWT({ 
    data: 'test',
    exp: now - 100
  })
    .setProtectedHeader({ alg: 'ES256' })
    .sign(privateKey);
  
  console.log('Testing expired token WITHOUT explicit options:');
  try {
    const result = await jwtVerify(expiredToken, publicKey);
    console.log('ERROR: Expired token accepted!');
  } catch (err) {
    console.log('✓ Expired token rejected:', err.code);
  }
}

testExpValidation();
