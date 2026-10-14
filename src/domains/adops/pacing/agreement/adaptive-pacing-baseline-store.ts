import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptivePacingBaseline } from "./adaptive-pacing-baseline.js";

/** Keeps adaptive pacing baselines by code. */
export interface AdaptivePacingBaselineStore {
  find(code: string): AdaptivePacingBaseline | undefined;
  save(item: AdaptivePacingBaseline): void;
  remove(code: string): boolean;
  list(): AdaptivePacingBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptivePacingBaselineStore implements AdaptivePacingBaselineStore {
  items: Map<string, AdaptivePacingBaseline>;
  order: string[];

  constructor(items: Map<string, AdaptivePacingBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptivePacingBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptivePacingBaseline): void {
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

  list(): AdaptivePacingBaseline[] {
    const out: AdaptivePacingBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptivePacingBaselineStore(): AdaptivePacingBaselineStore {
  return new MemoryAdaptivePacingBaselineStore(new Map<string, AdaptivePacingBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptivePacingBaselineStore implements AdaptivePacingBaselineStore {
  inner: AdaptivePacingBaselineStore;
  cache: cache.TtlCache<AdaptivePacingBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptivePacingBaselineStore,
    cacheValue: cache.TtlCache<AdaptivePacingBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptivePacingBaseline | undefined {
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

  save(item: AdaptivePacingBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptivePacingBaseline[] {
    return this.inner.list();
  }
}

export function newCachedAdaptivePacingBaselineStore(inner: AdaptivePacingBaselineStore, ttl: number, clockValue: clock.Clock): AdaptivePacingBaselineStore {
  return new CachedAdaptivePacingBaselineStore(
    inner,
    cache.newTtlCache<AdaptivePacingBaseline>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive pacing baselines. Empty fields match all. */
export class AdaptivePacingBaselineQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptivePacingBaseline): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptivePacingBaseline[]): AdaptivePacingBaseline[] {
    const matched = collections.filter(items, (candidate: AdaptivePacingBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptivePacingBaselines(store: AdaptivePacingBaselineStore, query: AdaptivePacingBaselineQuery): AdaptivePacingBaseline[] {
  return query.apply(store.list());
}
