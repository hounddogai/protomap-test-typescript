import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyQueueEstimate } from "./legacy-queue-estimate.js";

/** Keeps legacy queue estimates by code. */
export interface LegacyQueueEstimateStore {
  find(code: string): LegacyQueueEstimate | undefined;
  save(item: LegacyQueueEstimate): void;
  remove(code: string): boolean;
  list(): LegacyQueueEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyQueueEstimateStore implements LegacyQueueEstimateStore {
  items: Map<string, LegacyQueueEstimate>;
  order: string[];

  constructor(items: Map<string, LegacyQueueEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyQueueEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyQueueEstimate): void {
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

  list(): LegacyQueueEstimate[] {
    const out: LegacyQueueEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyQueueEstimateStore(): LegacyQueueEstimateStore {
  return new MemoryLegacyQueueEstimateStore(new Map<string, LegacyQueueEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyQueueEstimateStore implements LegacyQueueEstimateStore {
  inner: LegacyQueueEstimateStore;
  cache: cache.TtlCache<LegacyQueueEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyQueueEstimateStore,
    cacheValue: cache.TtlCache<LegacyQueueEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyQueueEstimate | undefined {
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

  save(item: LegacyQueueEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyQueueEstimate[] {
    return this.inner.list();
  }
}

export function newCachedLegacyQueueEstimateStore(inner: LegacyQueueEstimateStore, ttl: number, clockValue: clock.Clock): LegacyQueueEstimateStore {
  return new CachedLegacyQueueEstimateStore(inner, cache.newTtlCache<LegacyQueueEstimate>(256, ttl, clockValue), 0, 0);
}

/** Selects legacy queue estimates. Empty fields match all. */
export class LegacyQueueEstimateQuery {
  label: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minOpenRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyQueueEstimate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyQueueEstimate[]): LegacyQueueEstimate[] {
    const matched = collections.filter(items, (candidate: LegacyQueueEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyQueueEstimates(store: LegacyQueueEstimateStore, query: LegacyQueueEstimateQuery): LegacyQueueEstimate[] {
  return query.apply(store.list());
}
