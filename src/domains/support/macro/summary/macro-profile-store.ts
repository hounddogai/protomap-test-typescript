import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroProfile } from "./macro-profile.js";

/** Keeps macro profiles by code. */
export interface MacroProfileStore {
  find(code: string): MacroProfile | undefined;
  save(item: MacroProfile): void;
  remove(code: string): boolean;
  list(): MacroProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroProfileStore implements MacroProfileStore {
  items: Map<string, MacroProfile>;
  order: string[];

  constructor(items: Map<string, MacroProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroProfile): void {
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

  list(): MacroProfile[] {
    const out: MacroProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroProfileStore(): MacroProfileStore {
  return new MemoryMacroProfileStore(new Map<string, MacroProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroProfileStore implements MacroProfileStore {
  inner: MacroProfileStore;
  cache: cache.TtlCache<MacroProfile>;
  hits: number;
  misses: number;

  constructor(inner: MacroProfileStore, cacheValue: cache.TtlCache<MacroProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroProfile | undefined {
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

  save(item: MacroProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroProfile[] {
    return this.inner.list();
  }
}

export function newCachedMacroProfileStore(inner: MacroProfileStore, ttl: number, clockValue: clock.Clock): MacroProfileStore {
  return new CachedMacroProfileStore(inner, cache.newTtlCache<MacroProfile>(512, ttl, clockValue), 0, 0);
}

/** Selects macro profiles. Empty fields match all. */
export class MacroProfileQuery {
  label: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroProfile): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroProfile[]): MacroProfile[] {
    const matched = collections.filter(items, (candidate: MacroProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroProfiles(store: MacroProfileStore, query: MacroProfileQuery): MacroProfile[] {
  return query.apply(store.list());
}
