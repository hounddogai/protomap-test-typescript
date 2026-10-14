import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualBounceVariance } from "./manual-bounce-variance.js";

/** Keeps manual bounce variances by code. */
export interface ManualBounceVarianceStore {
  find(code: string): ManualBounceVariance | undefined;
  save(item: ManualBounceVariance): void;
  remove(code: string): boolean;
  list(): ManualBounceVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualBounceVarianceStore implements ManualBounceVarianceStore {
  items: Map<string, ManualBounceVariance>;
  order: string[];

  constructor(items: Map<string, ManualBounceVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualBounceVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualBounceVariance): void {
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

  list(): ManualBounceVariance[] {
    const out: ManualBounceVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualBounceVarianceStore(): ManualBounceVarianceStore {
  return new MemoryManualBounceVarianceStore(new Map<string, ManualBounceVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualBounceVarianceStore implements ManualBounceVarianceStore {
  inner: ManualBounceVarianceStore;
  cache: cache.TtlCache<ManualBounceVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualBounceVarianceStore,
    cacheValue: cache.TtlCache<ManualBounceVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualBounceVariance | undefined {
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

  save(item: ManualBounceVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualBounceVariance[] {
    return this.inner.list();
  }
}

export function newCachedManualBounceVarianceStore(inner: ManualBounceVarianceStore, ttl: number, clockValue: clock.Clock): ManualBounceVarianceStore {
  return new CachedManualBounceVarianceStore(
    inner,
    cache.newTtlCache<ManualBounceVariance>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual bounce variances. Empty fields match all. */
export class ManualBounceVarianceQuery {
  channel: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAmount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualBounceVariance): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualBounceVariance[]): ManualBounceVariance[] {
    const matched = collections.filter(items, (candidate: ManualBounceVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualBounceVariances(store: ManualBounceVarianceStore, query: ManualBounceVarianceQuery): ManualBounceVariance[] {
  return query.apply(store.list());
}
