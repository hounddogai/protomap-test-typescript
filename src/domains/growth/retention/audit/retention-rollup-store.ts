import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionRollup } from "./retention-rollup.js";

/** Keeps retention rollups by code. */
export interface RetentionRollupStore {
  find(code: string): RetentionRollup | undefined;
  save(item: RetentionRollup): void;
  remove(code: string): boolean;
  list(): RetentionRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionRollupStore implements RetentionRollupStore {
  items: Map<string, RetentionRollup>;
  order: string[];

  constructor(items: Map<string, RetentionRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionRollup): void {
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

  list(): RetentionRollup[] {
    const out: RetentionRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionRollupStore(): RetentionRollupStore {
  return new MemoryRetentionRollupStore(new Map<string, RetentionRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionRollupStore implements RetentionRollupStore {
  inner: RetentionRollupStore;
  cache: cache.TtlCache<RetentionRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionRollupStore,
    cacheValue: cache.TtlCache<RetentionRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionRollup | undefined {
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

  save(item: RetentionRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionRollup[] {
    return this.inner.list();
  }
}

export function newCachedRetentionRollupStore(inner: RetentionRollupStore, ttl: number, clockValue: clock.Clock): RetentionRollupStore {
  return new CachedRetentionRollupStore(inner, cache.newTtlCache<RetentionRollup>(512, ttl, clockValue), 0, 0);
}

/** Selects retention rollups. Empty fields match all. */
export class RetentionRollupQuery {
  name: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCost: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionRollup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionRollup[]): RetentionRollup[] {
    const matched = collections.filter(items, (candidate: RetentionRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionRollups(store: RetentionRollupStore, query: RetentionRollupQuery): RetentionRollup[] {
  return query.apply(store.list());
}
