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
export async function createCompetitor(form: FormData) {
  try { await store.createCompetitor(await token(), value(form, 'name'), value(form, 'publicUrl')); }
  catch { redirect('/competitors?error=1'); }
  redirect('/competitors');
}
export async function deleteCompetitor(form: FormData) {
  try { if (!(await store.deleteCompetitor(await token(), value(form, 'id')))) throw new Error('Not found'); }
  catch { redirect('/competitors?error=1'); }
  redirect('/competitors');
}
export async function addObservation(form: FormData) {
  try { await store.addObservation(await token(), value(form, 'competitorId'), value(form, 'kind'), value(form, 'note'), value(form, 'sourceUrl'), value(form, 'observedDate')); }
  catch { redirect('/competitors?error=1'); }
  redirect('/competitors');
}
export async function deleteObservation(form: FormData) {
  try { if (!(await store.deleteObservation(await token(), value(form, 'id')))) throw new Error('Not found'); }
  catch { redirect('/competitors?error=1'); }
  redirect('/competitors');
}
export async function planDraft(form: FormData) {
  try { if (!(await store.planDraft(await token(), value(form, 'id'), value(form, 'plannedDate'), value(form, 'category')))) throw new Error('Not found'); }
  catch { redirect('/drafts?error=1'); }
  redirect('/drafts');
}
export async function createIdea(form: FormData) {
  try { await store.createIdea(await token(), value(form, 'text')); }
  catch { redirect('/workflow?error=1'); }
  redirect('/workflow');
}
export async function changeEditorialStatus(form: FormData) {
  try {
    const version = value(form, 'version');
    if (!/^\d{1,10}$/.test(version)) throw new Error('Invalid version');
    await store.transitionEditorial(await token(), value(form, 'id'), value(form, 'target'), Number(version));
  } catch { redirect('/workflow?error=1'); }
  redirect('/workflow');
}

export async function reuseEditorial(form: FormData) {
  let id: string;
  try { id = (await store.reuseEditorial(await token(), value(form, 'id'))).id; }
  catch { redirect('/workflow?error=1'); }
  redirect(`/drafts?copied=1#draft-${id}`);
}
