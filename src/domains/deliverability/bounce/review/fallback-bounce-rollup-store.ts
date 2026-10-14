import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackBounceRollup } from "./fallback-bounce-rollup.js";

/** Keeps fallback bounce rollups by code. */
export interface FallbackBounceRollupStore {
  find(code: string): FallbackBounceRollup | undefined;
  save(item: FallbackBounceRollup): void;
  remove(code: string): boolean;
  list(): FallbackBounceRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackBounceRollupStore implements FallbackBounceRollupStore {
  items: Map<string, FallbackBounceRollup>;
  order: string[];

  constructor(items: Map<string, FallbackBounceRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackBounceRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackBounceRollup): void {
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

  list(): FallbackBounceRollup[] {
    const out: FallbackBounceRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackBounceRollupStore(): FallbackBounceRollupStore {
  return new MemoryFallbackBounceRollupStore(new Map<string, FallbackBounceRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackBounceRollupStore implements FallbackBounceRollupStore {
  inner: FallbackBounceRollupStore;
  cache: cache.TtlCache<FallbackBounceRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackBounceRollupStore,
    cacheValue: cache.TtlCache<FallbackBounceRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackBounceRollup | undefined {
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

  save(item: FallbackBounceRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackBounceRollup[] {
    return this.inner.list();
  }
}

export function newCachedFallbackBounceRollupStore(inner: FallbackBounceRollupStore, ttl: number, clockValue: clock.Clock): FallbackBounceRollupStore {
  return new CachedFallbackBounceRollupStore(
    inner,
    cache.newTtlCache<FallbackBounceRollup>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback bounce rollups. Empty fields match all. */
export class FallbackBounceRollupQuery {
  name: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackBounceRollup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackBounceRollup[]): FallbackBounceRollup[] {
    const matched = collections.filter(items, (candidate: FallbackBounceRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackBounceRollups(store: FallbackBounceRollupStore, query: FallbackBounceRollupQuery): FallbackBounceRollup[] {
  return query.apply(store.list());
}
