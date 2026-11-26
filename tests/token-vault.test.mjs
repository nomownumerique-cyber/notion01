import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { encryptToken, decryptToken } from '../src/security/token-vault.ts';
test('encrypts and decrypts with distinct random nonces', () => {
  const key = randomBytes(32); const a = encryptToken('secret', key, 'a'); const b = encryptToken('secret', key, 'a');
  assert.notEqual(a, b); assert.equal(decryptToken(a, key, 'a'), 'secret');
});
test('rejects wrong tenant, key, tampering and malformed envelopes', () => {
  const key = randomBytes(32), value = encryptToken('secret', key, 'a');
  assert.throws(() => decryptToken(value, key, 'b'));
  assert.throws(() => decryptToken(value, randomBytes(32), 'a'));
  const parts = value.split('.'); parts[3] = Buffer.from('altered').toString('base64url');
  assert.throws(() => decryptToken(parts.join('.'), key, 'a'));
  assert.throws(() => decryptToken('v1.a.b.c', key, 'a'));
  assert.throws(() => encryptToken('x', Buffer.alloc(12), 'a'));
  assert.throws(() => encryptToken('', key, 'a'));
});
