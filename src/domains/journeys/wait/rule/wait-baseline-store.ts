import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitBaseline } from "./wait-baseline.js";

/** Keeps wait baselines by code. */
export interface WaitBaselineStore {
  find(code: string): WaitBaseline | undefined;
  save(item: WaitBaseline): void;
  remove(code: string): boolean;
  list(): WaitBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitBaselineStore implements WaitBaselineStore {
  items: Map<string, WaitBaseline>;
  order: string[];

  constructor(items: Map<string, WaitBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitBaseline): void {
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

  list(): WaitBaseline[] {
    const out: WaitBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitBaselineStore(): WaitBaselineStore {
  return new MemoryWaitBaselineStore(new Map<string, WaitBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitBaselineStore implements WaitBaselineStore {
  inner: WaitBaselineStore;
  cache: cache.TtlCache<WaitBaseline>;
  hits: number;
  misses: number;

  constructor(inner: WaitBaselineStore, cacheValue: cache.TtlCache<WaitBaseline>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitBaseline | undefined {
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

  save(item: WaitBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitBaseline[] {
    return this.inner.list();
  }
}

export function newCachedWaitBaselineStore(inner: WaitBaselineStore, ttl: number, clockValue: clock.Clock): WaitBaselineStore {
  return new CachedWaitBaselineStore(inner, cache.newTtlCache<WaitBaseline>(128, ttl, clockValue), 0, 0);
}

/** Selects wait baselines. Empty fields match all. */
export class WaitBaselineQuery {
  utmSource: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRatio: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitBaseline): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitBaseline[]): WaitBaseline[] {
    const matched = collections.filter(items, (candidate: WaitBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitBaselines(store: WaitBaselineStore, query: WaitBaselineQuery): WaitBaseline[] {
  return query.apply(store.list());
}
