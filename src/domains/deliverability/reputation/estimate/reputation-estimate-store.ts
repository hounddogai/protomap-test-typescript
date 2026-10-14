import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationEstimate } from "./reputation-estimate.js";

/** Keeps reputation estimates by code. */
export interface ReputationEstimateStore {
  find(code: string): ReputationEstimate | undefined;
  save(item: ReputationEstimate): void;
  remove(code: string): boolean;
  list(): ReputationEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationEstimateStore implements ReputationEstimateStore {
  items: Map<string, ReputationEstimate>;
  order: string[];

  constructor(items: Map<string, ReputationEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationEstimate): void {
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

  list(): ReputationEstimate[] {
    const out: ReputationEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationEstimateStore(): ReputationEstimateStore {
  return new MemoryReputationEstimateStore(new Map<string, ReputationEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationEstimateStore implements ReputationEstimateStore {
  inner: ReputationEstimateStore;
  cache: cache.TtlCache<ReputationEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationEstimateStore,
    cacheValue: cache.TtlCache<ReputationEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationEstimate | undefined {
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

  save(item: ReputationEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationEstimate[] {
    return this.inner.list();
  }
}

export function newCachedReputationEstimateStore(inner: ReputationEstimateStore, ttl: number, clockValue: clock.Clock): ReputationEstimateStore {
  return new CachedReputationEstimateStore(inner, cache.newTtlCache<ReputationEstimate>(1024, ttl, clockValue), 0, 0);
}

/** Selects reputation estimates. Empty fields match all. */
export class ReputationEstimateQuery {
  title: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMaximum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationEstimate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationEstimate[]): ReputationEstimate[] {
    const matched = collections.filter(items, (candidate: ReputationEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationEstimates(store: ReputationEstimateStore, query: ReputationEstimateQuery): ReputationEstimate[] {
  return query.apply(store.list());
}
