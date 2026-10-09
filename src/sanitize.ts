const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/gi;

const INSTRUCTION_PATTERNS = [
  /^ignore previous/i,
  /^ignore all/i,
  /^forget/i,
  /^you are now/i,
  /^send to/i,
  /^system:/i,
  /^<system>/i,
  /^<instructions>/i,
  /^<important>/i,
];

export function sanitize(text: string): string {
  let result = text.replace(HTML_TAG_PATTERN, '');

  const lines = result.split('\n');
  const sanitizedLines = lines.map((line) => {
    const trimmed = line.trimStart();
    for (const pattern of INSTRUCTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return `[sanitized] ${trimmed}`;
      }
    }
    return line;
  });

  return sanitizedLines.join('\n');
}
