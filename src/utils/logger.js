import chalk from 'chalk';

export const logger = {
  banner() {
    console.log();
    console.log(chalk.cyan('  ┌──────────────────────────────────────────────────┐'));
    console.log(chalk.cyan('  │') + chalk.bold.white('                  CONTEXTRIG CLI                  ') + chalk.cyan('│'));
    console.log(chalk.cyan('  │') + chalk.gray('    AI Agent Context & Environment Scaffolder     ') + chalk.cyan('│'));
    console.log(chalk.cyan('  └──────────────────────────────────────────────────┘'));
    console.log();
  },

  info(msg) {
    console.log(chalk.cyan('›'), chalk.white(msg));
  },

  success(msg) {
    console.log(chalk.green('✔'), chalk.green(msg));
  },

  warn(msg) {
    console.log(chalk.yellow('!'), chalk.yellow(msg));
  },

  error(msg) {
    console.log(chalk.red('×'), chalk.red(msg));
  },

  step(msg) {
    console.log(chalk.cyan('›'), chalk.bold.white(msg));
  },

  divider() {
    console.log(chalk.gray('─'.repeat(52)));
  }
};
