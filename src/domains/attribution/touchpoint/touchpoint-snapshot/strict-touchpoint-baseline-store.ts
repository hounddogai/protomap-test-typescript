import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictTouchpointBaseline } from "./strict-touchpoint-baseline.js";

/** Keeps strict touchpoint baselines by code. */
export interface StrictTouchpointBaselineStore {
  find(code: string): StrictTouchpointBaseline | undefined;
  save(item: StrictTouchpointBaseline): void;
  remove(code: string): boolean;
  list(): StrictTouchpointBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictTouchpointBaselineStore implements StrictTouchpointBaselineStore {
  items: Map<string, StrictTouchpointBaseline>;
  order: string[];

  constructor(items: Map<string, StrictTouchpointBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictTouchpointBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictTouchpointBaseline): void {
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

  list(): StrictTouchpointBaseline[] {
    const out: StrictTouchpointBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictTouchpointBaselineStore(): StrictTouchpointBaselineStore {
  return new MemoryStrictTouchpointBaselineStore(new Map<string, StrictTouchpointBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictTouchpointBaselineStore implements StrictTouchpointBaselineStore {
  inner: StrictTouchpointBaselineStore;
  cache: cache.TtlCache<StrictTouchpointBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictTouchpointBaselineStore,
    cacheValue: cache.TtlCache<StrictTouchpointBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictTouchpointBaseline | undefined {
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

  save(item: StrictTouchpointBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictTouchpointBaseline[] {
    return this.inner.list();
  }
}

export function newCachedStrictTouchpointBaselineStore(inner: StrictTouchpointBaselineStore, ttl: number, clockValue: clock.Clock): StrictTouchpointBaselineStore {
  return new CachedStrictTouchpointBaselineStore(
    inner,
    cache.newTtlCache<StrictTouchpointBaseline>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict touchpoint baselines. Empty fields match all. */
export class StrictTouchpointBaselineQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictTouchpointBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictTouchpointBaseline[]): StrictTouchpointBaseline[] {
    const matched = collections.filter(items, (candidate: StrictTouchpointBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictTouchpointBaselines(store: StrictTouchpointBaselineStore, query: StrictTouchpointBaselineQuery): StrictTouchpointBaseline[] {
  return query.apply(store.list());
}
