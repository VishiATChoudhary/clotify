# Clotify

A Spotify CLI that lets you control playback, browse playlists, and manage your music — all from the terminal.

```
 ██████ ██       ██████  ████████ ██ ██████ ██    ██
██      ██      ██    ██    ██    ██ ██      ██  ██
██      ██      ██    ██    ██    ██ ██████   ████
██      ██      ██    ██    ██    ██ ██        ██
 ██████ ██████  ██████      ██    ██ ██        ██
         ♫  Your music, your terminal  ♫
```

## Prerequisites

- **Node.js 18+**
- **Spotify Premium** account (required for playback control)
- **Spotify Desktop App** installed and running — the API sends commands to an active Spotify session, it doesn't stream audio itself. Use `clotify open` to launch it, or open it manually before using any playback commands

## Setup

### 1. Create a Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **Create App**
4. Fill in the details:
   - **App name:** anything you like (e.g. "Clotify")
   - **App description:** anything
   - **Redirect URI:** `http://127.0.0.1:8888/callback`
   - **API access:** select **Web API**
5. Click **Save**
6. Go to your app's **Settings** and note your **Client ID** and **Client Secret**

> **Important:** The redirect URI must be exactly `http://127.0.0.1:8888/callback`. Spotify does not allow `localhost` — only the loopback IP `127.0.0.1`.

### 2. Install Clotify

```bash
npm install -g clotify
```

Or clone and install locally:

```bash
git clone https://github.com/VishiATChoudhary/clotify.git
cd clotify
npm install
npm install -g .
```

### 3. Configure Credentials

**Option A: `.env` file (recommended)**

Copy the example and fill in your credentials:

```bash
cp .env.example .env
```

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**Option B: Interactive prompt**

Just run `clotify login` and it will ask for your Client ID and Secret. They're saved for future sessions.

### 4. Log In

```bash
clotify login
```

This opens your browser for Spotify authorization. Grant access and you're done — tokens are saved and refreshed automatically.

## Commands

| Command | Description |
|---|---|
| `clotify login` | Authenticate with Spotify via browser OAuth |
| `clotify open` | Launch the Spotify desktop app and wait for it to be ready |
| `clotify now` | Show the currently playing track with a progress bar |
| `clotify play` | Resume playback |
| `clotify pause` | Pause playback |
| `clotify next` | Skip to the next track |
| `clotify prev` | Go to the previous track |
| `clotify shuffle` | Toggle shuffle on/off |
| `clotify playlists` | Browse playlists — play, browse tracks, remove tracks, edit descriptions |

### Now Playing

```
▶  Now Playing
   Song Title
   Artist Name — Album Name
   ████████████░░░░░░░░  1:23 / 3:45
```

### Playlists

When you select a playlist, you get an interactive menu:

- **Play this playlist** — start playing from the top
- **Browse & play a track** — pick a specific song to start from
- **Remove a track** — select one or more tracks to remove
- **Edit description** — update the playlist's description

## Limitations

- **You need to start playing a song first** — either from the Spotify app or by selecting a playlist with `clotify playlists`. Once something is playing, you can control playback (play, pause, next, prev, shuffle) from the terminal. The Spotify API cannot initiate playback from a completely idle state.

## Troubleshooting

**"No active Spotify device found"**
Run `clotify open` first, or open Spotify manually on any device (desktop, phone, web player).

**"Not logged in"**
Run `clotify login` to authenticate.

**"Forbidden" errors**
Your token may have stale scopes. Run `clotify login` again to re-authorize with the latest permissions.

**Redirect URI mismatch on login**
Make sure your Spotify Developer app has the redirect URI set to exactly `http://127.0.0.1:8888/callback` (not `localhost`, not `https`).

## License

MIT
