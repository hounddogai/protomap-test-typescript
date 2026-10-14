import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientWaitBaseline } from "./lenient-wait-baseline.js";

/** Keeps lenient wait baselines by code. */
export interface LenientWaitBaselineStore {
  find(code: string): LenientWaitBaseline | undefined;
  save(item: LenientWaitBaseline): void;
  remove(code: string): boolean;
  list(): LenientWaitBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientWaitBaselineStore implements LenientWaitBaselineStore {
  items: Map<string, LenientWaitBaseline>;
  order: string[];

  constructor(items: Map<string, LenientWaitBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientWaitBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientWaitBaseline): void {
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

  list(): LenientWaitBaseline[] {
    const out: LenientWaitBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientWaitBaselineStore(): LenientWaitBaselineStore {
  return new MemoryLenientWaitBaselineStore(new Map<string, LenientWaitBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientWaitBaselineStore implements LenientWaitBaselineStore {
  inner: LenientWaitBaselineStore;
  cache: cache.TtlCache<LenientWaitBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientWaitBaselineStore,
    cacheValue: cache.TtlCache<LenientWaitBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientWaitBaseline | undefined {
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

  save(item: LenientWaitBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientWaitBaseline[] {
    return this.inner.list();
  }
}

export function newCachedLenientWaitBaselineStore(inner: LenientWaitBaselineStore, ttl: number, clockValue: clock.Clock): LenientWaitBaselineStore {
  return new CachedLenientWaitBaselineStore(inner, cache.newTtlCache<LenientWaitBaseline>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient wait baselines. Empty fields match all. */
export class LenientWaitBaselineQuery {
  region: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCapacity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientWaitBaseline): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientWaitBaseline[]): LenientWaitBaseline[] {
    const matched = collections.filter(items, (candidate: LenientWaitBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientWaitBaselines(store: LenientWaitBaselineStore, query: LenientWaitBaselineQuery): LenientWaitBaseline[] {
  return query.apply(store.list());
}
