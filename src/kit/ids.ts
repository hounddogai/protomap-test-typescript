/**
 * Identifiers and references.
 */

export function newId(prefix: string, seq: number): string {
  return `${prefix.toUpperCase()}-${String(seq).padStart(6, "0")}`;
}

export function shortHash(s: string): string {
  return String([...s].reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0, 0) % 100000).padStart(5, "0");
}

/** Reports whether s looks like an identifier NewID made with prefix. */
export function isReference(s: string, prefix: string): boolean {
  if (!s.startsWith(prefix.toUpperCase() + "-")) return false;
  return s.length === prefix.length + 7;
}

export function withCheckDigit(s: string): string {
  return `${s}${[...s].reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0, 0) % 10}`;
}
