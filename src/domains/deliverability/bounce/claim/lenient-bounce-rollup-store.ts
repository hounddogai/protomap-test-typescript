import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientBounceRollup } from "./lenient-bounce-rollup.js";

/** Keeps lenient bounce rollups by code. */
export interface LenientBounceRollupStore {
  find(code: string): LenientBounceRollup | undefined;
  save(item: LenientBounceRollup): void;
  remove(code: string): boolean;
  list(): LenientBounceRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientBounceRollupStore implements LenientBounceRollupStore {
  items: Map<string, LenientBounceRollup>;
  order: string[];

  constructor(items: Map<string, LenientBounceRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientBounceRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientBounceRollup): void {
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

  list(): LenientBounceRollup[] {
    const out: LenientBounceRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientBounceRollupStore(): LenientBounceRollupStore {
  return new MemoryLenientBounceRollupStore(new Map<string, LenientBounceRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientBounceRollupStore implements LenientBounceRollupStore {
  inner: LenientBounceRollupStore;
  cache: cache.TtlCache<LenientBounceRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientBounceRollupStore,
    cacheValue: cache.TtlCache<LenientBounceRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientBounceRollup | undefined {
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

  save(item: LenientBounceRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientBounceRollup[] {
    return this.inner.list();
  }
}

export function newCachedLenientBounceRollupStore(inner: LenientBounceRollupStore, ttl: number, clockValue: clock.Clock): LenientBounceRollupStore {
  return new CachedLenientBounceRollupStore(inner, cache.newTtlCache<LenientBounceRollup>(256, ttl, clockValue), 0, 0);
}

/** Selects lenient bounce rollups. Empty fields match all. */
export class LenientBounceRollupQuery {
  locale: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAttempts: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientBounceRollup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientBounceRollup[]): LenientBounceRollup[] {
    const matched = collections.filter(items, (candidate: LenientBounceRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientBounceRollups(store: LenientBounceRollupStore, query: LenientBounceRollupQuery): LenientBounceRollup[] {
  return query.apply(store.list());
}
