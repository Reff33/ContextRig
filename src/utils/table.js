import chalk from 'chalk';

/**
 * Truncates and pads a string to fit exact column width.
 * @param {string} str
 * @param {number} width
 * @returns {string}
 */
function fit(str, width) {
  const clean = String(str || '').trim();
  if (clean.length > width) {
    return clean.slice(0, width - 1) + '…';
  }
  return clean.padEnd(width, ' ');
}

/**
 * Renders a clean ASCII/Unicode boxed table of skills for the CLI.
 * @param {Array<Object>} skills
 */
export function printSkillsTable(skills) {
  const w = {
    num: 3,
    id: 14,
    name: 36,
    desc: 38,
    cmd: 10
  };

  const topBorder = chalk.gray(`┌─${'─'.repeat(w.num)}─┬─${'─'.repeat(w.id)}─┬─${'─'.repeat(w.name)}─┬─${'─'.repeat(w.desc)}─┬─${'─'.repeat(w.cmd)}─┐`);
  const midBorder = chalk.gray(`├─${'─'.repeat(w.num)}─┼─${'─'.repeat(w.id)}─┼─${'─'.repeat(w.name)}─┼─${'─'.repeat(w.desc)}─┼─${'─'.repeat(w.cmd)}─┤`);
  const botBorder = chalk.gray(`└─${'─'.repeat(w.num)}─┴─${'─'.repeat(w.id)}─┴─${'─'.repeat(w.name)}─┴─${'─'.repeat(w.desc)}─┴─${'─'.repeat(w.cmd)}─┘`);

  const header = `${chalk.gray('│')} ${chalk.bold.cyan(fit('#', w.num))} ${chalk.gray('│')} ${chalk.bold.cyan(fit('Skill ID', w.id))} ${chalk.gray('│')} ${chalk.bold.cyan(fit('Skill Name', w.name))} ${chalk.gray('│')} ${chalk.bold.cyan(fit('Description', w.desc))} ${chalk.gray('│')} ${chalk.bold.cyan(fit('Command', w.cmd))} ${chalk.gray('│')}`;

  console.log();
  console.log(topBorder);
  console.log(header);
  console.log(midBorder);

  skills.forEach((skill, idx) => {
    const numStr = chalk.dim(fit(String(idx + 1), w.num));
    const idStr = chalk.cyan(fit(skill.id, w.id));
    const nameStr = chalk.white(fit(skill.name, w.name));
    const descStr = chalk.dim(fit(skill.description, w.desc));
    const cmdStr = skill.claude_command?.name
      ? chalk.green(fit(`/${skill.claude_command.name}`, w.cmd))
      : chalk.gray(fit('-', w.cmd));

    console.log(`${chalk.gray('│')} ${numStr} ${chalk.gray('│')} ${idStr} ${chalk.gray('│')} ${nameStr} ${chalk.gray('│')} ${descStr} ${chalk.gray('│')} ${cmdStr} ${chalk.gray('│')}`);
  });

  console.log(botBorder);
  console.log();
}
