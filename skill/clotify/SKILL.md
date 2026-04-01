---
name: clotify
description: Control Spotify playback from the terminal using the clotify CLI. Use when the user wants to play, pause, skip, shuffle, search for music, browse playlists, or check what's currently playing on Spotify. Triggers on "play music", "what's playing", "skip song", "pause spotify", "search for a song", "play a playlist", "shuffle", "open spotify", "next track", "previous track", or any music/Spotify-related request.
---

# Clotify — Spotify CLI

Control Spotify playback via the `clotify` CLI. All commands below are non-interactive and can be run directly via Bash.

## Prerequisites Check

Before running any command:

```bash
which clotify
```

If missing: `npm install -g clotify`. If not authenticated, tell the user to run `clotify login` interactively.

## Commands — All Non-Interactive

```bash
clotify open                          # Launch Spotify app, wait until ready
clotify now                           # Show currently playing track
clotify play                          # Resume playback
clotify pause                         # Pause playback
clotify next                          # Skip to next track
clotify prev                          # Go to previous track
clotify shuffle                       # Toggle shuffle on/off
clotify search "query" --first        # Search and auto-play top result
clotify playlists --play "name"       # Play a playlist by name (fuzzy match)
clotify playlists --list              # List all playlists (name | uri)
```

## Workflow Patterns

**User wants to play a specific song:**
```bash
clotify search "blinding lights" --first
```

**User wants to play a playlist:**
```bash
clotify playlists --play "Deep Focus"
```

**User asks "what's playing":**
Run `clotify now` and relay the output.

**User says "skip" / "next" / "pause" / "play" / "shuffle":**
Run the corresponding command directly.

**User wants to start listening from scratch:**
```bash
clotify open
clotify playlists --play "playlist name"
```

**User wants to see their playlists:**
```bash
clotify playlists --list
```

## Limitations

- Spotify Premium required for playback control
- Spotify must be running — use `clotify open` to launch it
- A song must be playing before play/pause/next/prev work; use `--play` or `--first` to start from scratch
- `clotify login` requires browser interaction — cannot be automated
