#!/usr/bin/env node

import { Command } from 'commander';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { login, ensureAuth } from './src/auth.js';
import { nowPlaying, play, pause, next, prev, shuffle, search, playlists, waitForDevice } from './src/spotify.js';

const banner = `
${chalk.hex('#1DB954')(' ██████') + chalk.hex('#1ED760')(' ██') + chalk.hex('#2EE07A')('      ') + chalk.hex('#4DE88F')('██████') + chalk.hex('#6CF0A4')('  ████████') + chalk.hex('#8BF7B9')(' ██') + chalk.hex('#AAF0CE')(' ██████') + chalk.hex('#C9F7E3')(' ██    ██')}
${chalk.hex('#1DB954')('██') + chalk.hex('#1ED760')('      ██') + chalk.hex('#2EE07A')('     ') + chalk.hex('#4DE88F')('██    ██') + chalk.hex('#6CF0A4')('    ██') + chalk.hex('#8BF7B9')('    ██') + chalk.hex('#AAF0CE')(' ██') + chalk.hex('#C9F7E3')('      ██  ██ ')}
${chalk.hex('#E8B828')('██') + chalk.hex('#F0C040')('      ██') + chalk.hex('#F5D060')('     ') + chalk.hex('#FAE080')('██    ██') + chalk.hex('#FFE599')('    ██') + chalk.hex('#FFEDAA')('    ██') + chalk.hex('#FFF2BB')(' ██████') + chalk.hex('#FFF7CC')('   ████  ')}
${chalk.hex('#FF6B6B')('██') + chalk.hex('#FF8585')('      ██') + chalk.hex('#FF9E9E')('     ') + chalk.hex('#FFB8B8')('██    ██') + chalk.hex('#FFD1D1')('    ██') + chalk.hex('#FF8585')('    ██') + chalk.hex('#FF6B6B')(' ██') + chalk.hex('#FF5252')('        ██   ')}
${chalk.hex('#C850C0')(' ██████') + chalk.hex('#D16BD1')(' ██████') + chalk.hex('#DA86DA')('  ██████') + chalk.hex('#E3A1E3')('     ██') + chalk.hex('#ECBBEC')('    ██') + chalk.hex('#C850C0')(' ██') + chalk.hex('#B43AB4')('        ██   ')}
${chalk.hex('#1DB954')('         ♫') + chalk.hex('#FFE599')('  Your music, your terminal') + chalk.hex('#C850C0')('  ♫')}
`;

const program = new Command();

program.name('clotify').description('Spotify CLI').version('1.0.0');
program.addHelpText('beforeAll', banner);

program.command('login').description('Authenticate with Spotify via browser OAuth').action(login);

program
  .command('open')
  .description('Launch the Spotify app')
  .action(async () => {
    ensureAuth();
    const platform = process.platform;
    try {
      if (platform === 'darwin') {
        execSync('open -a Spotify');
      } else if (platform === 'win32') {
        execSync('start spotify:');
      } else {
        execSync('spotify &', { stdio: 'ignore' });
      }
      console.log(chalk.dim('Launching Spotify...'));
      await waitForDevice();
      console.log(chalk.green('✓ Spotify is ready.'));
    } catch {
      console.log(chalk.red('Could not launch Spotify. Is it installed?'));
    }
  });

program
  .command('now')
  .description('Show currently playing track')
  .action(() => {
    ensureAuth();
    nowPlaying();
  });

program
  .command('play')
  .description('Resume playback')
  .action(() => {
    ensureAuth();
    play();
  });

program
  .command('pause')
  .description('Pause playback')
  .action(() => {
    ensureAuth();
    pause();
  });

program
  .command('next')
  .description('Skip to next track')
  .action(() => {
    ensureAuth();
    next();
  });

program
  .command('prev')
  .description('Go to previous track')
  .action(() => {
    ensureAuth();
    prev();
  });

program
  .command('shuffle')
  .description('Toggle shuffle on/off')
  .action(() => {
    ensureAuth();
    shuffle();
  });

program
  .command('search <query...>')
  .description('Search for a song and play it')
  .action((query) => {
    ensureAuth();
    search(query.join(' '));
  });

program
  .command('playlists')
  .description('Interactive list of playlists — select to play')
  .action(() => {
    ensureAuth();
    playlists();
  });

program.parse();
