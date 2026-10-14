import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyActivationEstimate } from "./legacy-activation-estimate.js";

/** Keeps legacy activation estimates by code. */
export interface LegacyActivationEstimateStore {
  find(code: string): LegacyActivationEstimate | undefined;
  save(item: LegacyActivationEstimate): void;
  remove(code: string): boolean;
  list(): LegacyActivationEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyActivationEstimateStore implements LegacyActivationEstimateStore {
  items: Map<string, LegacyActivationEstimate>;
  order: string[];

  constructor(items: Map<string, LegacyActivationEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyActivationEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyActivationEstimate): void {
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

  list(): LegacyActivationEstimate[] {
    const out: LegacyActivationEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyActivationEstimateStore(): LegacyActivationEstimateStore {
  return new MemoryLegacyActivationEstimateStore(new Map<string, LegacyActivationEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyActivationEstimateStore implements LegacyActivationEstimateStore {
  inner: LegacyActivationEstimateStore;
  cache: cache.TtlCache<LegacyActivationEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyActivationEstimateStore,
    cacheValue: cache.TtlCache<LegacyActivationEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyActivationEstimate | undefined {
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

  save(item: LegacyActivationEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyActivationEstimate[] {
    return this.inner.list();
  }
}

export function newCachedLegacyActivationEstimateStore(inner: LegacyActivationEstimateStore, ttl: number, clockValue: clock.Clock): LegacyActivationEstimateStore {
  return new CachedLegacyActivationEstimateStore(
    inner,
    cache.newTtlCache<LegacyActivationEstimate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy activation estimates. Empty fields match all. */
export class LegacyActivationEstimateQuery {
  source: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minGraceDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyActivationEstimate): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyActivationEstimate[]): LegacyActivationEstimate[] {
    const matched = collections.filter(items, (candidate: LegacyActivationEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyActivationEstimates(store: LegacyActivationEstimateStore, query: LegacyActivationEstimateQuery): LegacyActivationEstimate[] {
  return query.apply(store.list());
}
