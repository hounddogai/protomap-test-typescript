import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveFunnelBaseline } from "./adaptive-funnel-baseline.js";

/** Keeps adaptive funnel baselines by code. */
export interface AdaptiveFunnelBaselineStore {
  find(code: string): AdaptiveFunnelBaseline | undefined;
  save(item: AdaptiveFunnelBaseline): void;
  remove(code: string): boolean;
  list(): AdaptiveFunnelBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveFunnelBaselineStore implements AdaptiveFunnelBaselineStore {
  items: Map<string, AdaptiveFunnelBaseline>;
  order: string[];

  constructor(items: Map<string, AdaptiveFunnelBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveFunnelBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveFunnelBaseline): void {
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

  list(): AdaptiveFunnelBaseline[] {
    const out: AdaptiveFunnelBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveFunnelBaselineStore(): AdaptiveFunnelBaselineStore {
  return new MemoryAdaptiveFunnelBaselineStore(new Map<string, AdaptiveFunnelBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveFunnelBaselineStore implements AdaptiveFunnelBaselineStore {
  inner: AdaptiveFunnelBaselineStore;
  cache: cache.TtlCache<AdaptiveFunnelBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveFunnelBaselineStore,
    cacheValue: cache.TtlCache<AdaptiveFunnelBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveFunnelBaseline | undefined {
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

  save(item: AdaptiveFunnelBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveFunnelBaseline[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveFunnelBaselineStore(inner: AdaptiveFunnelBaselineStore, ttl: number, clockValue: clock.Clock): AdaptiveFunnelBaselineStore {
  return new CachedAdaptiveFunnelBaselineStore(
    inner,
    cache.newTtlCache<AdaptiveFunnelBaseline>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive funnel baselines. Empty fields match all. */
export class AdaptiveFunnelBaselineQuery {
  title: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minImpressions: number, statuses: string[], limit: number) {
    this.title = title;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveFunnelBaseline): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveFunnelBaseline[]): AdaptiveFunnelBaseline[] {
    const matched = collections.filter(items, (candidate: AdaptiveFunnelBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveFunnelBaselines(store: AdaptiveFunnelBaselineStore, query: AdaptiveFunnelBaselineQuery): AdaptiveFunnelBaseline[] {
  return query.apply(store.list());
}
