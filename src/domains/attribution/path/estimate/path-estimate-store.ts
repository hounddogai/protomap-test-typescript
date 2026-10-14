import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathEstimate } from "./path-estimate.js";

/** Keeps path estimates by code. */
export interface PathEstimateStore {
  find(code: string): PathEstimate | undefined;
  save(item: PathEstimate): void;
  remove(code: string): boolean;
  list(): PathEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathEstimateStore implements PathEstimateStore {
  items: Map<string, PathEstimate>;
  order: string[];

  constructor(items: Map<string, PathEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathEstimate): void {
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

  list(): PathEstimate[] {
    const out: PathEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathEstimateStore(): PathEstimateStore {
  return new MemoryPathEstimateStore(new Map<string, PathEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathEstimateStore implements PathEstimateStore {
  inner: PathEstimateStore;
  cache: cache.TtlCache<PathEstimate>;
  hits: number;
  misses: number;

  constructor(inner: PathEstimateStore, cacheValue: cache.TtlCache<PathEstimate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathEstimate | undefined {
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

  save(item: PathEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathEstimate[] {
    return this.inner.list();
  }
}

export function newCachedPathEstimateStore(inner: PathEstimateStore, ttl: number, clockValue: clock.Clock): PathEstimateStore {
  return new CachedPathEstimateStore(inner, cache.newTtlCache<PathEstimate>(128, ttl, clockValue), 0, 0);
}

/** Selects path estimates. Empty fields match all. */
export class PathEstimateQuery {
  channel: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minImpressions: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathEstimate): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathEstimate[]): PathEstimate[] {
    const matched = collections.filter(items, (candidate: PathEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathEstimates(store: PathEstimateStore, query: PathEstimateQuery): PathEstimate[] {
  return query.apply(store.list());
}
