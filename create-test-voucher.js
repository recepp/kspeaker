// Test Voucher Creator Script
// Usage: node create-test-voucher.js

const crypto = require('crypto');

// Generate a random voucher code (same format as backend)
function generateVoucherCode() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

// Create test voucher
const voucher = generateVoucherCode();
const expiresAt = new Date();
expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

console.log('\n🎟️  TEST VOUCHER CREATED\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Voucher Code: ${voucher}`);
console.log(`Expires: ${expiresAt.toISOString()}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📱 HOW TO USE:\n');
console.log('1. Open Kspeaker app');
console.log('2. Send 5 messages (to trigger voucher modal)');
console.log('3. Enter this voucher code');
console.log('4. Enjoy unlimited messages! 🚀\n');
console.log('💡 TIP: Copy this code now:\n');
console.log(`   ${voucher}\n`);
