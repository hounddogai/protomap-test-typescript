import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultWarmupEstimate } from "./default-warmup-estimate.js";

/** Keeps default warmup estimates by code. */
export interface DefaultWarmupEstimateStore {
  find(code: string): DefaultWarmupEstimate | undefined;
  save(item: DefaultWarmupEstimate): void;
  remove(code: string): boolean;
  list(): DefaultWarmupEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultWarmupEstimateStore implements DefaultWarmupEstimateStore {
  items: Map<string, DefaultWarmupEstimate>;
  order: string[];

  constructor(items: Map<string, DefaultWarmupEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultWarmupEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultWarmupEstimate): void {
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

  list(): DefaultWarmupEstimate[] {
    const out: DefaultWarmupEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultWarmupEstimateStore(): DefaultWarmupEstimateStore {
  return new MemoryDefaultWarmupEstimateStore(new Map<string, DefaultWarmupEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultWarmupEstimateStore implements DefaultWarmupEstimateStore {
  inner: DefaultWarmupEstimateStore;
  cache: cache.TtlCache<DefaultWarmupEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultWarmupEstimateStore,
    cacheValue: cache.TtlCache<DefaultWarmupEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultWarmupEstimate | undefined {
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

  save(item: DefaultWarmupEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultWarmupEstimate[] {
    return this.inner.list();
  }
}

export function newCachedDefaultWarmupEstimateStore(inner: DefaultWarmupEstimateStore, ttl: number, clockValue: clock.Clock): DefaultWarmupEstimateStore {
  return new CachedDefaultWarmupEstimateStore(
    inner,
    cache.newTtlCache<DefaultWarmupEstimate>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default warmup estimates. Empty fields match all. */
export class DefaultWarmupEstimateQuery {
  utmSource: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minImpressions: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultWarmupEstimate): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultWarmupEstimate[]): DefaultWarmupEstimate[] {
    const matched = collections.filter(items, (candidate: DefaultWarmupEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultWarmupEstimates(store: DefaultWarmupEstimateStore, query: DefaultWarmupEstimateQuery): DefaultWarmupEstimate[] {
  return query.apply(store.list());
}
