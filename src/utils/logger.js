import chalk from 'chalk';

export const logger = {
  banner(version = null, serverUrl = null) {
    const total = 50;
    const center = (text, plainLen = text.length) => {
      const left = Math.max(0, Math.floor((total - plainLen) / 2));
      const right = Math.max(0, total - plainLen - left);
      return ' '.repeat(left) + text + ' '.repeat(right);
    };

    console.log();
    console.log(chalk.cyan('  ┌──────────────────────────────────────────────────┐'));
    console.log(chalk.cyan('  │') + center(chalk.bold.white('CONTEXTRIG CLI'), 14) + chalk.cyan('│'));
    if (version) {
      const tag = String(version).startsWith('0.') ? `v${version} (beta)` : `v${version}`;
      console.log(chalk.cyan('  │') + center(chalk.yellow(tag), tag.length) + chalk.cyan('│'));
    }
    if (serverUrl) {
      const rawText = `🚀 Server: ${serverUrl}`;
      const styledText = `${chalk.white('🚀 Server: ')}${chalk.green(serverUrl)}`;
      console.log(chalk.cyan('  │') + center(styledText, rawText.length) + chalk.cyan('│'));
    }
    console.log(chalk.cyan('  └──────────────────────────────────────────────────┘'));
    console.log();
  },

  info(msg) {
    console.log(chalk.cyan('›  ') + chalk.white(msg));
  },

  success(msg) {
    console.log(chalk.green('✔  ') + chalk.green(msg));
  },

  warn(msg) {
    console.log(chalk.yellow('!  ') + chalk.yellow(msg));
  },

  error(msg) {
    console.log(chalk.red('×  ') + chalk.red(msg));
  },

  step(msg) {
    console.log(chalk.cyan('›  ') + chalk.bold.white(msg));
  },

  divider() {
    console.log(chalk.gray('─'.repeat(52)));
  },

  section(title) {
    console.log();
    this.divider();
    console.log();
    this.step(title);
    console.log();
  }
};
