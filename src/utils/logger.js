import chalk from 'chalk';

export const logger = {
  banner() {
    console.log();
    console.log(chalk.bold.cyan('╔═══════════════════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('║               🛠️  CONTEXTRIG CLI                   ║'));
    console.log(chalk.bold.cyan('║     AI Agent Context & Environment Scaffolder     ║'));
    console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════╝'));
    console.log();
  },

  info(msg) {
    console.log(chalk.blue('ℹ'), chalk.white(msg));
  },

  success(msg) {
    console.log(chalk.green('✔'), chalk.bold.green(msg));
  },

  warn(msg) {
    console.log(chalk.yellow('⚠'), chalk.yellow(msg));
  },

  error(msg) {
    console.log(chalk.red('✖'), chalk.bold.red(msg));
  },

  step(msg) {
    console.log(chalk.cyan('➜'), chalk.bold(msg));
  },

  divider() {
    console.log(chalk.gray('─'.repeat(52)));
  }
};

