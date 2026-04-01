import fs from 'fs';
import http from 'http';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import inquirer from 'inquirer';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, '.clotify-config.json');
const TOKENS_PATH = path.join(ROOT, '.clotify-tokens.json');
const REDIRECT_URI = 'http://127.0.0.1:8888/callback';
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ');

function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const vars = {};
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w]+)\s*=\s*(.+)\s*$/);
      if (match) vars[match[1]] = match[2];
    }
    if (vars.SPOTIFY_CLIENT_ID && vars.SPOTIFY_CLIENT_SECRET) {
      return { client_id: vars.SPOTIFY_CLIENT_ID, client_secret: vars.SPOTIFY_CLIENT_SECRET };
    }
  } catch {}
  return null;
}

function loadJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch {
    return null;
  }
}

function saveJSON(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function openBrowser(url) {
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  execSync(`${cmd} "${url}"`);
}

export async function login() {
  const env = loadEnv();
  const existing = loadJSON(CONFIG_PATH);

  let client_id, client_secret;

  if (env) {
    client_id = env.client_id;
    client_secret = env.client_secret;
    console.log(chalk.green('✓ Using credentials from .env file.'));
  } else {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'client_id', message: 'Spotify Client ID:', default: existing?.client_id },
      { type: 'password', name: 'client_secret', message: 'Spotify Client Secret:', mask: '*' },
    ]);
    client_id = answers.client_id;
    client_secret = answers.client_secret;
  }

  saveJSON(CONFIG_PATH, { client_id, client_secret });
  console.log(chalk.green('✓ Credentials saved.'));

  const authUrl =
    `https://accounts.spotify.com/authorize?response_type=code` +
    `&client_id=${client_id}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  console.log(chalk.dim('Opening browser for Spotify authorization...'));
  openBrowser(authUrl);

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:8888`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>Authorization failed</h1><p>You can close this tab.</p>');
        server.close();
        reject(new Error(`Authorization denied: ${error}`));
        return;
      }

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Success!</h1><p>You can close this tab and return to the terminal.</p>');
        server.close();
        resolve(code);
      }
    });

    server.listen(8888, () => {
      console.log(chalk.dim('Waiting for callback on http://127.0.0.1:8888/callback ...'));
    });
  });

  const auth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }).toString(),
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  saveJSON(TOKENS_PATH, {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  });

  console.log(chalk.green('✓ Logged in to Spotify!'));
}

async function refreshToken() {
  const config = loadJSON(CONFIG_PATH);
  const tokens = loadJSON(TOKENS_PATH);
  if (!config || !tokens?.refresh_token) {
    throw new Error('Missing credentials. Run `clotify login` first.');
  }

  const auth = Buffer.from(`${config.client_id}:${config.client_secret}`).toString('base64');
  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
    }).toString(),
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  tokens.access_token = data.access_token;
  tokens.expires_at = Date.now() + data.expires_in * 1000;
  if (data.refresh_token) {
    tokens.refresh_token = data.refresh_token;
  }
  saveJSON(TOKENS_PATH, tokens);
  return tokens.access_token;
}

export async function getAccessToken() {
  const tokens = loadJSON(TOKENS_PATH);
  if (!tokens?.refresh_token) {
    throw new Error('Not logged in. Run `clotify login` first.');
  }

  if (Date.now() > tokens.expires_at - 60_000) {
    return refreshToken();
  }

  return tokens.access_token;
}

export function ensureAuth() {
  const tokens = loadJSON(TOKENS_PATH);
  if (!tokens?.refresh_token) {
    console.log(chalk.red('Not logged in. Run `clotify login` first.'));
    process.exit(1);
  }
}
