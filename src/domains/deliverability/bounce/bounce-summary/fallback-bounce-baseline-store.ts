import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackBounceBaseline } from "./fallback-bounce-baseline.js";

/** Keeps fallback bounce baselines by code. */
export interface FallbackBounceBaselineStore {
  find(code: string): FallbackBounceBaseline | undefined;
  save(item: FallbackBounceBaseline): void;
  remove(code: string): boolean;
  list(): FallbackBounceBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackBounceBaselineStore implements FallbackBounceBaselineStore {
  items: Map<string, FallbackBounceBaseline>;
  order: string[];

  constructor(items: Map<string, FallbackBounceBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackBounceBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackBounceBaseline): void {
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

  list(): FallbackBounceBaseline[] {
    const out: FallbackBounceBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackBounceBaselineStore(): FallbackBounceBaselineStore {
  return new MemoryFallbackBounceBaselineStore(new Map<string, FallbackBounceBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackBounceBaselineStore implements FallbackBounceBaselineStore {
  inner: FallbackBounceBaselineStore;
  cache: cache.TtlCache<FallbackBounceBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackBounceBaselineStore,
    cacheValue: cache.TtlCache<FallbackBounceBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackBounceBaseline | undefined {
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

  save(item: FallbackBounceBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackBounceBaseline[] {
    return this.inner.list();
  }
}

export function newCachedFallbackBounceBaselineStore(inner: FallbackBounceBaselineStore, ttl: number, clockValue: clock.Clock): FallbackBounceBaselineStore {
  return new CachedFallbackBounceBaselineStore(
    inner,
    cache.newTtlCache<FallbackBounceBaseline>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback bounce baselines. Empty fields match all. */
export class FallbackBounceBaselineQuery {
  utmSource: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minClicks: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackBounceBaseline): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackBounceBaseline[]): FallbackBounceBaseline[] {
    const matched = collections.filter(items, (candidate: FallbackBounceBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackBounceBaselines(store: FallbackBounceBaselineStore, query: FallbackBounceBaselineQuery): FallbackBounceBaseline[] {
  return query.apply(store.list());
}
