import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

function validate(key: Buffer, tenantId: string): void {
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error('A 32-byte key is required');
  if (!tenantId || Buffer.byteLength(tenantId, 'utf8') > 1024) throw new Error('Invalid tenant');
}
function decode(value: string): Buffer {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid token envelope');
  const bytes = Buffer.from(value, 'base64url');
  if (bytes.toString('base64url') !== value) throw new Error('Invalid token envelope');
  return bytes;
}
function aad(tenantId: string): Buffer { return Buffer.from(`marketing-os:oauth:v1:${tenantId}`, 'utf8'); }

export function encryptToken(token: string, key: Buffer, tenantId: string): string {
  validate(key, tenantId);
  if (!token || Buffer.byteLength(token, 'utf8') > 16384) throw new Error('Invalid token');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(aad(tenantId));
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), ciphertext.toString('base64url')].join('.');
}

export function decryptToken(envelope: string, key: Buffer, tenantId: string): string {
  validate(key, tenantId);
  const parts = envelope.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') throw new Error('Invalid token envelope');
  const iv = decode(parts[1]); const tag = decode(parts[2]); const ciphertext = decode(parts[3]);
  if (iv.length !== 12 || tag.length !== 16 || ciphertext.length > 16384) throw new Error('Invalid token envelope');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(aad(tenantId)); decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
