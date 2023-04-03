export default function $$escape(value: string, asComment = false): string {
  if (asComment) {
    return value.replace(/>/g, '&gt;')
      .replace(/</g, '&lt;');
  }
  return value.replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
    .replace(/'/g, '&#39;');
}
