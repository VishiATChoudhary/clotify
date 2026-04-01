import axios from 'axios';
import chalk from 'chalk';
import inquirer from 'inquirer';
import searchPrompt from '@inquirer/search';
import { getAccessToken } from './auth.js';

const API = 'https://api.spotify.com/v1';

async function api(method, endpoint, data, retried = false) {
  const token = await getAccessToken();
  try {
    const res = await axios({
      method,
      url: `${API}${endpoint}`,
      headers: { Authorization: `Bearer ${token}` },
      data,
      validateStatus: (s) => s < 500,
    });

    if (res.status === 401 && !retried) {
      return api(method, endpoint, data, true);
    }

    if (res.status === 404 || res.data?.error?.reason === 'NO_ACTIVE_DEVICE') {
      console.log(chalk.yellow('No active Spotify device found. Open Spotify on any device first.'));
      process.exit(1);
    }

    if (res.status >= 400) {
      const msg = res.data?.error?.message || `HTTP ${res.status}`;
      console.log(chalk.red(`Spotify API error: ${msg}`));
      process.exit(1);
    }

    return res;
  } catch (err) {
    console.log(chalk.red(`Request failed: ${err.message}`));
    process.exit(1);
  }
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export async function nowPlaying() {
  const res = await api('get', '/me/player/currently-playing');

  if (res.status === 204 || !res.data?.item) {
    console.log(chalk.dim('Nothing is currently playing.'));
    return;
  }

  const { item, progress_ms, is_playing } = res.data;
  const title = item.name;
  const artist = item.artists.map((a) => a.name).join(', ');
  const album = item.album.name;
  const duration = item.duration_ms;
  const progress = progress_ms || 0;

  const barWidth = 20;
  const filled = Math.round((progress / duration) * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

  const icon = is_playing ? '▶' : '⏸';

  console.log();
  console.log(chalk.green(`${icon}  Now Playing`));
  console.log(chalk.bold(`   ${title}`));
  console.log(chalk.dim(`   ${artist} — ${album}`));
  console.log(`   ${bar}  ${formatTime(progress)} / ${formatTime(duration)}`);
  console.log();
}

async function ensureDevice() {
  const res = await api('get', '/me/player/devices');
  const devices = res.data?.devices || [];
  if (!devices.length) {
    console.log(chalk.yellow('No active Spotify device found. Open Spotify on any device first.'));
    process.exit(1);
  }
  const active = devices.find((d) => d.is_active);
  if (!active) {
    await api('put', '/me/player', { device_ids: [devices[0].id], play: false });
  }
  return devices;
}

export async function play() {
  await ensureDevice();
  await api('put', '/me/player/play');
  console.log(chalk.green('▶ Playback resumed.'));
}

export async function pause() {
  await api('put', '/me/player/pause');
  console.log(chalk.yellow('⏸ Playback paused.'));
}

export async function next() {
  await api('post', '/me/player/next');
  console.log(chalk.green('⏭ Skipped to next track.'));
}

export async function prev() {
  await api('post', '/me/player/previous');
  console.log(chalk.green('⏮ Back to previous track.'));
}

export async function waitForDevice(maxWait = 15000) {
  const interval = 1500;
  let elapsed = 0;
  while (elapsed < maxWait) {
    const token = await getAccessToken();
    const res = await axios.get(`${API}/me/player/devices`, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    if (res.status === 200 && res.data.devices?.length > 0) return;
    await new Promise((r) => setTimeout(r, interval));
    elapsed += interval;
  }
  console.log(chalk.yellow('Spotify launched but no active device detected yet. Try playing manually first.'));
}

export async function shuffle() {
  const res = await api('get', '/me/player');
  if (res.status === 204 || !res.data) {
    console.log(chalk.yellow('No active Spotify device found. Open Spotify on any device first.'));
    return;
  }
  const newState = !res.data.shuffle_state;
  await api('put', `/me/player/shuffle?state=${newState}`);
  console.log(newState ? chalk.green('🔀 Shuffle on.') : chalk.dim('Shuffle off.'));
}

export async function search(query, { first = false } = {}) {
  const res = await api('get', `/search?q=${encodeURIComponent(query)}&type=track&limit=10`);
  const tracks = res.data.tracks?.items || [];

  if (!tracks.length) {
    console.log(chalk.dim('No results found.'));
    return;
  }

  if (first) {
    const t = tracks[0];
    await ensureDevice();
    await api('put', '/me/player/play', { uris: [t.uri] });
    console.log(chalk.green(`▶ Playing: ${t.name} — ${t.artists.map((a) => a.name).join(', ')}`));
    return;
  }

  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: `Results for "${query}":`,
      pageSize: 15,
      choices: [
        ...tracks.map((t) => ({
          name: `${t.name} — ${chalk.dim(t.artists.map((a) => a.name).join(', '))}`,
          value: t.uri,
        })),
        new inquirer.Separator(),
        { name: 'Cancel', value: null },
      ],
    },
  ]);

  if (selected) {
    await ensureDevice();
    await api('put', '/me/player/play', { uris: [selected] });
    console.log(chalk.green('▶ Playing.'));
  }
}

export async function playlists({ playName, list } = {}) {
  const res = await api('get', '/me/playlists?limit=50');
  const items = res.data.items.filter(Boolean);

  if (!items.length) {
    console.log(chalk.dim('No playlists found.'));
    return;
  }

  if (list) {
    items.forEach((p) => console.log(`${p.name} | ${p.uri}`));
    return;
  }

  if (playName) {
    const match = items.find((p) => p.name.toLowerCase() === playName.toLowerCase())
      || items.find((p) => p.name.toLowerCase().includes(playName.toLowerCase()));
    if (!match) {
      console.log(chalk.red(`No playlist matching "${playName}".`));
      return;
    }
    await ensureDevice();
    await api('put', '/me/player/play', { context_uri: match.uri });
    console.log(chalk.green(`▶ Playing: ${match.name}`));
    return;
  }

  const selected = await searchPrompt({
    message: 'Search playlists:',
    pageSize: 15,
    source: (input) => {
      const term = (input || '').toLowerCase();
      return items
        .filter((p) => !term || p.name.toLowerCase().includes(term))
        .map((p) => ({
          name: `${p.name}${p.tracks?.total != null ? ` (${p.tracks.total} tracks)` : ''}`,
          value: { uri: p.uri, id: p.id, name: p.name },
        }));
    },
  });

  await playlistMenu(selected);
}

async function fetchPlaylistTracks(playlistId) {
  const tracks = [];
  let url = `/playlists/${playlistId}/items?limit=100`;
  while (url) {
    const res = await api('get', url);
    tracks.push(...res.data.items.filter((t) => t.item));
    url = res.data.next ? res.data.next.replace(API, '') : null;
  }
  return tracks;
}

async function playlistMenu(playlist) {
  while (true) {
    const tracks = await fetchPlaylistTracks(playlist.id);

    console.log();
    console.log(chalk.bold(`${playlist.name}`) + chalk.dim(` — ${tracks.length} tracks`));
    console.log();

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What do you want to do?',
        pageSize: 15,
        choices: [
          { name: 'Play this playlist', value: 'play' },
          { name: 'Browse & play a track', value: 'browse' },
          { name: 'Remove a track', value: 'remove' },
          { name: 'Edit description', value: 'describe' },
          new inquirer.Separator(),
          { name: 'Back', value: 'back' },
        ],
      },
    ]);

    if (action === 'back') return;

    if (action === 'play') {
      await api('put', '/me/player/play', { context_uri: playlist.uri });
      console.log(chalk.green('▶ Playing playlist.'));
      return;
    }

    if (action === 'browse') {
      const { track } = await inquirer.prompt([
        {
          type: 'list',
          name: 'track',
          message: 'Select a track to play:',
          pageSize: 20,
          choices: [
            ...tracks.map((t, i) => ({
              name: `${chalk.dim(`${i + 1}.`)} ${t.item.name} — ${chalk.dim(t.item.artists.map((a) => a.name).join(', '))}`,
              value: t.item.uri,
            })),
            new inquirer.Separator(),
            { name: 'Back', value: null },
          ],
        },
      ]);

      if (track) {
        await api('put', '/me/player/play', {
          context_uri: playlist.uri,
          offset: { uri: track },
        });
        console.log(chalk.green('▶ Playing track.'));
      }
    }

    if (action === 'remove') {
      const { toRemove } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'toRemove',
          message: 'Select tracks to remove:',
          pageSize: 20,
          choices: tracks.map((t, i) => ({
            name: `${i + 1}. ${t.item.name} — ${t.item.artists.map((a) => a.name).join(', ')}`,
            value: t.item.uri,
          })),
        },
      ]);

      if (toRemove.length) {
        await api('delete', `/playlists/${playlist.id}/tracks`, {
          tracks: toRemove.map((uri) => ({ uri })),
        });
        console.log(chalk.green(`✓ Removed ${toRemove.length} track(s).`));
      } else {
        console.log(chalk.dim('No tracks selected.'));
      }
    }

    if (action === 'describe') {
      const plRes = await api('get', `/playlists/${playlist.id}`);
      const current = plRes.data.description || '';
      if (current) console.log(chalk.dim(`Current: ${current}`));

      const { newDesc } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newDesc',
          message: 'New description:',
          default: current,
        },
      ]);

      await api('put', `/playlists/${playlist.id}`, { description: newDesc });
      console.log(chalk.green('✓ Description updated.'));
    }
  }
}
