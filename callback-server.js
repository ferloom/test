// Samodzielny serwer callback OAuth2 - tylko sygnał (event) dla bota.
// Nie nadaje ról ani nie wysyła DM - robi to bot.
// Uruchomienie:  node callback-server.js  (wymaga Node.js 18+, bez npm install)

const http = require('http');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const p = path.join(__dirname, '.env');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim();
  }
}
loadEnv();

const PORT = parseInt(process.env.OAUTH_PORT || '1635', 10);
const HOST = process.env.OAUTH_HOST || `http://localhost:${PORT}`;
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || `${HOST}/callback`;
const STATE_FILE = path.join(__dirname, 'callback-state.json');

let state = { pending: [] };
if (fs.existsSync(STATE_FILE)) {
  try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (e) {}
}
function saveState() {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state)); } catch (e) {}
}

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, REDIRECT_URI);

    if (url.pathname === '/callback') {
      const userId = url.searchParams.get('state');
      console.log(`Callback OAuth2: userId=${userId}`);

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<html><head><meta charset="utf-8"><title>Odwołania</title></head>
        <body style="font-family:sans-serif;text-align:center;padding-top:80px">
          <h2 style="color:#57F287">✅ Autoryzacja pomyślna!</h2>
          <p>Możesz wrócić do Discorda. Bot wkrótce się odezwie.</p>
        </body></html>`);

      if (userId) {
        if (!state.pending.includes(userId)) state.pending.push(userId);
        saveState();
        console.log(`Event w kolejce dla bota: ${userId}`);
      }
      return;
    }

    if (url.pathname === '/events' && req.method === 'GET') {
      console.log(`GET /events -> ${state.pending.length} oczekujących`);
      sendJson(res, 200, { events: state.pending });
      return;
    }

    if (url.pathname === '/events/ack' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;
      let processedList = [];
      try { processedList = (JSON.parse(body || '{}').processed) || []; } catch (e) {}
      state.pending = state.pending.filter(id => !processedList.includes(id));
      saveState();
      console.log(`ACK od bota: ${processedList.length} zdarzeń usuniętych`);
      sendJson(res, 200, { ok: true });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (e) {
    console.log('Błąd serwera:', e.message);
    if (!res.writableEnded) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Callback server działa: http://localhost:${PORT}/callback`);
  console.log(`Redirect URI (wpisz w Developer Portal): ${REDIRECT_URI}`);
});
// Samodzielny serwer callback OAuth2 - tylko sygnał (event) dla bota.
// Nie nadaje ról ani nie wysyła DM - robi to bot.
// Uruchomienie:  node callback-server.js  (wymaga Node.js 18+, bez npm install)

const http = require('http');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const p = path.join(__dirname, '.env');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim();
  }
}
loadEnv();

const PORT = parseInt(process.env.OAUTH_PORT || '1635', 10);
const HOST = process.env.OAUTH_HOST || `http://localhost:${PORT}`;
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || `${HOST}/callback`;
const STATE_FILE = path.join(__dirname, 'callback-state.json');

let state = { pending: [], processed: {} };
if (fs.existsSync(STATE_FILE)) {
  try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (e) {}
}
function saveState() {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state)); } catch (e) {}
}

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, REDIRECT_URI);

    if (url.pathname === '/callback') {
      const userId = url.searchParams.get('state');
      console.log(`Callback OAuth2: userId=${userId}`);

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<html><head><meta charset="utf-8"><title>Odwołania</title></head>
        <body style="font-family:sans-serif;text-align:center;padding-top:80px">
          <h2 style="color:#57F287">✅ Autoryzacja pomyślna!</h2>
          <p>Możesz wrócić do Discorda. Bot wkrótce się odezwie.</p>
        </body></html>`);

      if (userId && !state.processed[userId]) {
        state.processed[userId] = new Date().toISOString();
        if (!state.pending.includes(userId)) state.pending.push(userId);
        saveState();
        console.log(`Event w kolejce dla bota: ${userId}`);
      }
      return;
    }

    if (url.pathname === '/events' && req.method === 'GET') {
      console.log(`GET /events -> ${state.pending.length} oczekujących`);
      sendJson(res, 200, { events: state.pending });
      return;
    }

    if (url.pathname === '/events/ack' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;
      let processedList = [];
      try { processedList = (JSON.parse(body || '{}').processed) || []; } catch (e) {}
      state.pending = state.pending.filter(id => !processedList.includes(id));
      saveState();
      console.log(`ACK od bota: ${processedList.length} zdarzeń usuniętych`);
      sendJson(res, 200, { ok: true });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (e) {
    console.log('Błąd serwera:', e.message);
    if (!res.writableEnded) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Callback server działa: http://localhost:${PORT}/callback`);
  console.log(`Redirect URI (wpisz w Developer Portal): ${REDIRECT_URI}`);
});
