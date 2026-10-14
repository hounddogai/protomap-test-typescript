import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroTier } from "./macro-tier.js";

/** Keeps macro tiers by code. */
export interface MacroTierStore {
  find(code: string): MacroTier | undefined;
  save(item: MacroTier): void;
  remove(code: string): boolean;
  list(): MacroTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroTierStore implements MacroTierStore {
  items: Map<string, MacroTier>;
  order: string[];

  constructor(items: Map<string, MacroTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroTier): void {
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

  list(): MacroTier[] {
    const out: MacroTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroTierStore(): MacroTierStore {
  return new MemoryMacroTierStore(new Map<string, MacroTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroTierStore implements MacroTierStore {
  inner: MacroTierStore;
  cache: cache.TtlCache<MacroTier>;
  hits: number;
  misses: number;

  constructor(inner: MacroTierStore, cacheValue: cache.TtlCache<MacroTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroTier | undefined {
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

  save(item: MacroTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroTier[] {
    return this.inner.list();
  }
}

export function newCachedMacroTierStore(inner: MacroTierStore, ttl: number, clockValue: clock.Clock): MacroTierStore {
  return new CachedMacroTierStore(inner, cache.newTtlCache<MacroTier>(1024, ttl, clockValue), 0, 0);
}

/** Selects macro tiers. Empty fields match all. */
export class MacroTierQuery {
  title: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDiscount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroTier): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroTier[]): MacroTier[] {
    const matched = collections.filter(items, (candidate: MacroTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroTiers(store: MacroTierStore, query: MacroTierQuery): MacroTier[] {
  return query.apply(store.list());
}
