import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledTouchpointBaseline } from "./scheduled-touchpoint-baseline.js";

/** Keeps scheduled touchpoint baselines by code. */
export interface ScheduledTouchpointBaselineStore {
  find(code: string): ScheduledTouchpointBaseline | undefined;
  save(item: ScheduledTouchpointBaseline): void;
  remove(code: string): boolean;
  list(): ScheduledTouchpointBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledTouchpointBaselineStore implements ScheduledTouchpointBaselineStore {
  items: Map<string, ScheduledTouchpointBaseline>;
  order: string[];

  constructor(items: Map<string, ScheduledTouchpointBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledTouchpointBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledTouchpointBaseline): void {
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

  list(): ScheduledTouchpointBaseline[] {
    const out: ScheduledTouchpointBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledTouchpointBaselineStore(): ScheduledTouchpointBaselineStore {
  return new MemoryScheduledTouchpointBaselineStore(new Map<string, ScheduledTouchpointBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledTouchpointBaselineStore implements ScheduledTouchpointBaselineStore {
  inner: ScheduledTouchpointBaselineStore;
  cache: cache.TtlCache<ScheduledTouchpointBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledTouchpointBaselineStore,
    cacheValue: cache.TtlCache<ScheduledTouchpointBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledTouchpointBaseline | undefined {
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

  save(item: ScheduledTouchpointBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledTouchpointBaseline[] {
    return this.inner.list();
  }
}

export function newCachedScheduledTouchpointBaselineStore(inner: ScheduledTouchpointBaselineStore, ttl: number, clockValue: clock.Clock): ScheduledTouchpointBaselineStore {
  return new CachedScheduledTouchpointBaselineStore(
    inner,
    cache.newTtlCache<ScheduledTouchpointBaseline>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled touchpoint baselines. Empty fields match all. */
export class ScheduledTouchpointBaselineQuery {
  region: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMargin: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledTouchpointBaseline): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledTouchpointBaseline[]): ScheduledTouchpointBaseline[] {
    const matched = collections.filter(items, (candidate: ScheduledTouchpointBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledTouchpointBaselines(store: ScheduledTouchpointBaselineStore, query: ScheduledTouchpointBaselineQuery): ScheduledTouchpointBaseline[] {
  return query.apply(store.list());
}
