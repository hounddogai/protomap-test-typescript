import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledSuppressionEstimate } from "./scheduled-suppression-estimate.js";

/** Keeps scheduled suppression estimates by code. */
export interface ScheduledSuppressionEstimateStore {
  find(code: string): ScheduledSuppressionEstimate | undefined;
  save(item: ScheduledSuppressionEstimate): void;
  remove(code: string): boolean;
  list(): ScheduledSuppressionEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledSuppressionEstimateStore implements ScheduledSuppressionEstimateStore {
  items: Map<string, ScheduledSuppressionEstimate>;
  order: string[];

  constructor(items: Map<string, ScheduledSuppressionEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledSuppressionEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledSuppressionEstimate): void {
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

  list(): ScheduledSuppressionEstimate[] {
    const out: ScheduledSuppressionEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledSuppressionEstimateStore(): ScheduledSuppressionEstimateStore {
  return new MemoryScheduledSuppressionEstimateStore(new Map<string, ScheduledSuppressionEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledSuppressionEstimateStore implements ScheduledSuppressionEstimateStore {
  inner: ScheduledSuppressionEstimateStore;
  cache: cache.TtlCache<ScheduledSuppressionEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledSuppressionEstimateStore,
    cacheValue: cache.TtlCache<ScheduledSuppressionEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledSuppressionEstimate | undefined {
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

  save(item: ScheduledSuppressionEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledSuppressionEstimate[] {
    return this.inner.list();
  }
}

export function newCachedScheduledSuppressionEstimateStore(inner: ScheduledSuppressionEstimateStore, ttl: number, clockValue: clock.Clock): ScheduledSuppressionEstimateStore {
  return new CachedScheduledSuppressionEstimateStore(
    inner,
    cache.newTtlCache<ScheduledSuppressionEstimate>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled suppression estimates. Empty fields match all. */
export class ScheduledSuppressionEstimateQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledSuppressionEstimate): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledSuppressionEstimate[]): ScheduledSuppressionEstimate[] {
    const matched = collections.filter(items, (candidate: ScheduledSuppressionEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledSuppressionEstimates(store: ScheduledSuppressionEstimateStore, query: ScheduledSuppressionEstimateQuery): ScheduledSuppressionEstimate[] {
  return query.apply(store.list());
}
