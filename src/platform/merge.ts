/** Enrich a response with nonempty fields; repeated results retain every upstream contribution. */
export function mergeResponses<T extends object>(...responses: T[]): T {
  function merge(previous: unknown, next: unknown): unknown {
    if (next === undefined || next === "" || next === 0 || next === false) return previous ?? next;
    if (Array.isArray(next)) return [...(Array.isArray(previous) ? previous : []), ...next];
    if (next !== null && typeof next === "object" && !(next instanceof Uint8Array)) {
      const base: Record<string, unknown> = previous !== null && typeof previous === "object" ?
        { ...previous } : {};
      for (const [key, value] of Object.entries(next)) base[key] = merge(base[key], value);
      return base;
    }
    return next;
  }
  // The recursive merge preserves the message's field names and scalar types.
  return responses.reduce<unknown>((previous, next) => merge(previous, next), {}) as T;
}
