import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalMacroOverride } from "./global-macro-override.js";

/** Keeps global macro overrides by code. */
export interface GlobalMacroOverrideStore {
  find(code: string): GlobalMacroOverride | undefined;
  save(item: GlobalMacroOverride): void;
  remove(code: string): boolean;
  list(): GlobalMacroOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalMacroOverrideStore implements GlobalMacroOverrideStore {
  items: Map<string, GlobalMacroOverride>;
  order: string[];

  constructor(items: Map<string, GlobalMacroOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalMacroOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalMacroOverride): void {
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

  list(): GlobalMacroOverride[] {
    const out: GlobalMacroOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalMacroOverrideStore(): GlobalMacroOverrideStore {
  return new MemoryGlobalMacroOverrideStore(new Map<string, GlobalMacroOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalMacroOverrideStore implements GlobalMacroOverrideStore {
  inner: GlobalMacroOverrideStore;
  cache: cache.TtlCache<GlobalMacroOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalMacroOverrideStore,
    cacheValue: cache.TtlCache<GlobalMacroOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalMacroOverride | undefined {
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

  save(item: GlobalMacroOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalMacroOverride[] {
    return this.inner.list();
  }
}

export function newCachedGlobalMacroOverrideStore(inner: GlobalMacroOverrideStore, ttl: number, clockValue: clock.Clock): GlobalMacroOverrideStore {
  return new CachedGlobalMacroOverrideStore(inner, cache.newTtlCache<GlobalMacroOverride>(512, ttl, clockValue), 0, 0);
}

/** Selects global macro overrides. Empty fields match all. */
export class GlobalMacroOverrideQuery {
  country: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minEndsAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalMacroOverride): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalMacroOverride[]): GlobalMacroOverride[] {
    const matched = collections.filter(items, (candidate: GlobalMacroOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalMacroOverrides(store: GlobalMacroOverrideStore, query: GlobalMacroOverrideQuery): GlobalMacroOverride[] {
  return query.apply(store.list());
}
