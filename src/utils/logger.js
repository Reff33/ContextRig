import chalk from 'chalk';

export const logger = {
  banner(version = null) {
    console.log();
    console.log(chalk.cyan('  ┌──────────────────────────────────────────────────┐'));
    console.log(chalk.cyan('  │') + chalk.bold.white('                  CONTEXTRIG CLI                  ') + chalk.cyan('│'));
    console.log(chalk.cyan('  │') + chalk.gray('    AI Agent Context & Environment Scaffolder     ') + chalk.cyan('│'));
    if (version) {
      const tag = String(version).startsWith('0.') ? `v${version} (beta)` : `v${version}`;
      const total = 50;
      const left = Math.floor((total - tag.length) / 2);
      const right = total - tag.length - left;
      const line = ' '.repeat(left) + tag + ' '.repeat(right);
      console.log(chalk.cyan('  │') + chalk.yellow(line) + chalk.cyan('│'));
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
