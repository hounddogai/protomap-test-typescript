import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupBaseline } from "./warmup-baseline.js";

/** Keeps warmup baselines by code. */
export interface WarmupBaselineStore {
  find(code: string): WarmupBaseline | undefined;
  save(item: WarmupBaseline): void;
  remove(code: string): boolean;
  list(): WarmupBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupBaselineStore implements WarmupBaselineStore {
  items: Map<string, WarmupBaseline>;
  order: string[];

  constructor(items: Map<string, WarmupBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupBaseline): void {
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

  list(): WarmupBaseline[] {
    const out: WarmupBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupBaselineStore(): WarmupBaselineStore {
  return new MemoryWarmupBaselineStore(new Map<string, WarmupBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupBaselineStore implements WarmupBaselineStore {
  inner: WarmupBaselineStore;
  cache: cache.TtlCache<WarmupBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: WarmupBaselineStore,
    cacheValue: cache.TtlCache<WarmupBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupBaseline | undefined {
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

  save(item: WarmupBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupBaseline[] {
    return this.inner.list();
  }
}

export function newCachedWarmupBaselineStore(inner: WarmupBaselineStore, ttl: number, clockValue: clock.Clock): WarmupBaselineStore {
  return new CachedWarmupBaselineStore(inner, cache.newTtlCache<WarmupBaseline>(1024, ttl, clockValue), 0, 0);
}

/** Selects warmup baselines. Empty fields match all. */
export class WarmupBaselineQuery {
  name: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minConversionRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupBaseline[]): WarmupBaseline[] {
    const matched = collections.filter(items, (candidate: WarmupBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupBaselines(store: WarmupBaselineStore, query: WarmupBaselineQuery): WarmupBaseline[] {
  return query.apply(store.list());
}
