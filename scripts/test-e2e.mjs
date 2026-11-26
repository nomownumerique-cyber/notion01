import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
async function freePort() {
  const server = createServer(); await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port;
}
function run(command, args, env) { return spawn(command, args, { env: { ...process.env, ...env }, stdio: 'inherit' }); }
function wait(child) { return new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Process exited: ${code}`))); }); }
const database = await PGlite.create();
let socket, app;
try {
  await database.exec(await readFile(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
  const dbPort = await freePort(), appPort = await freePort();
  socket = new PGLiteSocketServer({ db: database, port: dbPort, host: '127.0.0.1', maxConnections: 20 }); await socket.start();
  const env = { DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${dbPort}/postgres`, PORT: String(appPort), NEXT_TELEMETRY_DISABLED: '1' };
  await wait(run('npm', ['run', 'migrate'], env));
  await wait(run('npm', ['run', 'migrate'], env));
  await wait(run('npm', ['run', 'build'], env));
  app = run(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(appPort)], env);
  const base = `http://127.0.0.1:${appPort}`;
  let ready = false;
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`${base}/login`)).ok) { ready = true; break; } } catch {} await delay(500); }
  if (!ready) throw new Error('Application did not start');
  await wait(run(process.execPath, ['tests/e2e.mjs'], { ...env, TEST_BASE_URL: base }));
} finally {
  if (app && app.exitCode === null) { app.kill('SIGTERM'); await new Promise(resolve => app.once('exit', resolve)); }
  if (socket) await socket.stop();
  await database.close();
}
