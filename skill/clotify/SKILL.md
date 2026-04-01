---
name: clotify
description: Control Spotify playback from the terminal using the clotify CLI. Use when the user wants to play, pause, skip, shuffle, search for music, browse playlists, or check what's currently playing on Spotify. Triggers on "play music", "what's playing", "skip song", "pause spotify", "search for a song", "play a playlist", "shuffle", "open spotify", "next track", "previous track", or any music/Spotify-related request.
---

# Clotify — Spotify CLI

Control Spotify playback via the `clotify` CLI. Requires `npm install -g clotify` and `clotify login` (browser OAuth).

## Prerequisites Check

Before running any command, verify clotify is available:

```bash
which clotify
```

If missing: `npm install -g clotify`. If not authenticated, tell the user to run `clotify login` — it requires browser interaction.

## Commands

| Command | Interactive |
|---|---|
| `clotify open` — Launch Spotify and wait for device | No |
| `clotify now` — Show currently playing track | No |
| `clotify play` — Resume playback | No |
| `clotify pause` — Pause playback | No |
| `clotify next` — Skip to next track | No |
| `clotify prev` — Previous track | No |
| `clotify shuffle` — Toggle shuffle | No |
| `clotify search <query>` — Search and play a song | Yes |
| `clotify playlists` — Browse/play/edit playlists | Yes |

## Usage

**Non-interactive commands** — run directly via Bash and relay output to user.

**Interactive commands** (`search`, `playlists`) — instruct the user to run these themselves since they require arrow key selection. Suggest: `! clotify search <query>` or `! clotify playlists`.

## Workflow Patterns

**Start listening:** `clotify open` then tell user to run `! clotify playlists` or `! clotify search <query>`.

**"What's playing?":** Run `clotify now`, relay the output.

**"Skip/next/pause/play":** Run the corresponding command directly.

**"Play something specific":** Tell user to run `! clotify search <query>`.

## Limitations

- Spotify Premium required
- Spotify must be running on a device — `clotify open` launches it
- A song must be playing before play/pause/next/prev work; use playlists or search to start from scratch
