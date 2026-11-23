/**
 * Normalises a skill's slash command declarations.
 * Accepts the legacy single `claude_command` object and the newer `claude_commands` array.
 * @param {Object} skill
 * @returns {Array<{name: string, content: string}>}
 */
export function getSkillCommands(skill) {
  const raw = skill?.claude_commands ?? (skill?.claude_command ? [skill.claude_command] : []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((cmd) => cmd?.name && cmd?.content);
}

/**
 * Combined `commit, commit-v` label, or null when the skill has no commands.
 * @param {Object} skill
 * @returns {string|null}
 */
export function getSkillCommandsLabel(skill) {
  const names = getSkillCommands(skill).map((cmd) => cmd.name);
  return names.length > 0 ? names.join(', ') : null;
}
