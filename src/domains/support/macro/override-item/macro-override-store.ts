import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroOverride } from "./macro-override.js";

/** Keeps macro overrides by code. */
export interface MacroOverrideStore {
  find(code: string): MacroOverride | undefined;
  save(item: MacroOverride): void;
  remove(code: string): boolean;
  list(): MacroOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroOverrideStore implements MacroOverrideStore {
  items: Map<string, MacroOverride>;
  order: string[];

  constructor(items: Map<string, MacroOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroOverride): void {
    if (!this.items.has(item.code)) {
      this.order.push(item.code);
    }
    this.items.set(item.code, item);
  }

  remove(code: string): boolean {
    if (!this.items.has(code)) return false;
    this.items.delete(code);
    const kept: string[] = [];
    for (const existing of this.order) {
      if (existing !== code) {
        kept.push(existing);
      }
    }
    this.order = kept;
    return true;
  }

  list(): MacroOverride[] {
    const out: MacroOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroOverrideStore(): MacroOverrideStore {
  return new MemoryMacroOverrideStore(new Map<string, MacroOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroOverrideStore implements MacroOverrideStore {
  inner: MacroOverrideStore;
  cache: cache.TtlCache<MacroOverride>;
  hits: number;
  misses: number;

  constructor(inner: MacroOverrideStore, cacheValue: cache.TtlCache<MacroOverride>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroOverride | undefined {
    const hit = this.cache.get(code);
    if (hit === undefined) {
      this.misses += 1;
      const found = this.inner.find(code);
      if (found === undefined) return undefined;
      this.cache.put(code, found);
      return found;
    }
    this.hits += 1;
    return hit;
  }

  save(item: MacroOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroOverride[] {
    return this.inner.list();
  }
}

export function newCachedMacroOverrideStore(inner: MacroOverrideStore, ttl: number, clockValue: clock.Clock): MacroOverrideStore {
  return new CachedMacroOverrideStore(inner, cache.newTtlCache<MacroOverride>(128, ttl, clockValue), 0, 0);
}

/** Selects macro overrides. Empty fields match all. */
export class MacroOverrideQuery {
  label: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minStartsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroOverride[]): MacroOverride[] {
    const matched = collections.filter(items, (candidate: MacroOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroOverrides(store: MacroOverrideStore, query: MacroOverrideQuery): MacroOverride[] {
  return query.apply(store.list());
}
