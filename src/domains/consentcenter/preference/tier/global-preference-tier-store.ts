import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalPreferenceTier } from "./global-preference-tier.js";

/** Keeps global preference tiers by code. */
export interface GlobalPreferenceTierStore {
  find(code: string): GlobalPreferenceTier | undefined;
  save(item: GlobalPreferenceTier): void;
  remove(code: string): boolean;
  list(): GlobalPreferenceTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalPreferenceTierStore implements GlobalPreferenceTierStore {
  items: Map<string, GlobalPreferenceTier>;
  order: string[];

  constructor(items: Map<string, GlobalPreferenceTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalPreferenceTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalPreferenceTier): void {
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

  list(): GlobalPreferenceTier[] {
    const out: GlobalPreferenceTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalPreferenceTierStore(): GlobalPreferenceTierStore {
  return new MemoryGlobalPreferenceTierStore(new Map<string, GlobalPreferenceTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalPreferenceTierStore implements GlobalPreferenceTierStore {
  inner: GlobalPreferenceTierStore;
  cache: cache.TtlCache<GlobalPreferenceTier>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalPreferenceTierStore,
    cacheValue: cache.TtlCache<GlobalPreferenceTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalPreferenceTier | undefined {
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

  save(item: GlobalPreferenceTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalPreferenceTier[] {
    return this.inner.list();
  }
}

export function newCachedGlobalPreferenceTierStore(inner: GlobalPreferenceTierStore, ttl: number, clockValue: clock.Clock): GlobalPreferenceTierStore {
  return new CachedGlobalPreferenceTierStore(
    inner,
    cache.newTtlCache<GlobalPreferenceTier>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global preference tiers. Empty fields match all. */
export class GlobalPreferenceTierQuery {
  title: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minConversionRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalPreferenceTier): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalPreferenceTier[]): GlobalPreferenceTier[] {
    const matched = collections.filter(items, (candidate: GlobalPreferenceTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalPreferenceTiers(store: GlobalPreferenceTierStore, query: GlobalPreferenceTierQuery): GlobalPreferenceTier[] {
  return query.apply(store.list());
}
