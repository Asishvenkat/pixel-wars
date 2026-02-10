const assert = require('assert');
const GridManager = require('./GridManager');

console.log('🧪 Running GridManager Tests...');

// 1. Setup
const gm = new GridManager(10, 1000); // 10x10, 1s cooldown
const user1 = 'user-123';
const user2 = 'user-456';

gm.addUser(user1, 'red');
gm.addUser(user2, 'blue');

console.log('✅ Users added successfully');

// 2. Test Capture
const block = gm.captureBlock(user1, 5, 5);
assert.strictEqual(block.ownerId, user1);
assert.strictEqual(block.x, 5);
assert.strictEqual(block.y, 5);
console.log('✅ Block capture successful');

// 3. Test Cooldown
const canCaptureImmediately = gm.canCapture(user1, 5, 6);
assert.strictEqual(canCaptureImmediately.allowed, false);
assert(canCaptureImmediately.error.includes('Cooldown'));
console.log('✅ Cooldown enforced');

// 4. Test Boundaries
const outOfBounds = gm.canCapture(user1, 99, 99);
assert.strictEqual(outOfBounds.allowed, false);
console.log('✅ Boundary check passed');

// 5. Test State
const state = gm.getGridState();
assert.strictEqual(state.length, 1); // 1 block captured
console.log('✅ State retrieval correct');

console.log('🎉 ALL TESTS PASSED!');
