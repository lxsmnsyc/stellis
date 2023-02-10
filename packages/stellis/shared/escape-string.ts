function escapeChar(str: string, value: string, replacement: string): string {
  let result = '';

  let prev = 0;
  let index = str.indexOf(value);
  while (index > -1) {
    result += str.substring(prev, index) + replacement;
    prev = index + 1;
    index = str.indexOf(value, prev);
  }

  if (prev < str.length) {
    result += str.substring(prev);
  }

  return result;
}

export default function $$escape(value: string, asComment = false): string {
  if (asComment) {
    return escapeChar(escapeChar(value, '>', '&gt;'), '<', '&lt;');
  }
  const noAmp = escapeChar(value, '&', '&amp;');
  const noQuotes = escapeChar(noAmp, '"', '&quot;');
  const noLT = escapeChar(noQuotes, '<', '&lt;');
  const noGT = escapeChar(noLT, '>', '&gt;');
  return escapeChar(noGT, "'", '&#39;');
}
