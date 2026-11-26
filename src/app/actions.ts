'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createStore } from '../db/store';
import { db } from '../db/client';
const store = createStore(db);
const sessionCookie = 'marketing_os_session';
async function token() { return (await cookies()).get(sessionCookie)?.value; }
async function setSession(value: string) {
  (await cookies()).set(sessionCookie, value, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 7 * 24 * 60 * 60 });
}
const value = (form: FormData, key: string) => typeof form.get(key) === 'string' ? String(form.get(key)) : '';
export async function register(form: FormData) {
  let session: string;
  try { session = await store.register(value(form, 'email'), value(form, 'password'), value(form, 'workspace')); }
  catch { redirect('/register?error=1'); }
  await setSession(session); redirect('/dashboard');
}
export async function login(form: FormData) {
  let session: string;
  try { session = await store.login(value(form, 'email'), value(form, 'password')); }
  catch { redirect('/login?error=1'); }
  await setSession(session); redirect('/dashboard');
}
export async function logout() {
  await store.logout(await token()); (await cookies()).delete(sessionCookie); redirect('/login');
}
export async function createDraft(form: FormData) {
  try { await store.createDraft(await token(), value(form, 'text')); }
  catch { redirect('/drafts?error=1'); }
  redirect('/drafts');
}
export async function updateDraft(form: FormData) {
  try { if (!(await store.updateDraft(await token(), value(form, 'id'), value(form, 'text')))) throw new Error('Not found'); }
  catch { redirect('/drafts?error=1'); }
  redirect('/drafts');
}
export async function deleteDraft(form: FormData) {
  try { if (!(await store.deleteDraft(await token(), value(form, 'id')))) throw new Error('Not found'); }
  catch { redirect('/drafts?error=1'); }
  redirect('/drafts');
}
