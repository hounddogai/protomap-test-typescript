import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationAdjustment } from "./reputation-adjustment.js";

/** Keeps reputation adjustments by code. */
export interface ReputationAdjustmentStore {
  find(code: string): ReputationAdjustment | undefined;
  save(item: ReputationAdjustment): void;
  remove(code: string): boolean;
  list(): ReputationAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationAdjustmentStore implements ReputationAdjustmentStore {
  items: Map<string, ReputationAdjustment>;
  order: string[];

  constructor(items: Map<string, ReputationAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationAdjustment): void {
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

  list(): ReputationAdjustment[] {
    const out: ReputationAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationAdjustmentStore(): ReputationAdjustmentStore {
  return new MemoryReputationAdjustmentStore(new Map<string, ReputationAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationAdjustmentStore implements ReputationAdjustmentStore {
  inner: ReputationAdjustmentStore;
  cache: cache.TtlCache<ReputationAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationAdjustmentStore,
    cacheValue: cache.TtlCache<ReputationAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationAdjustment | undefined {
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

  save(item: ReputationAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedReputationAdjustmentStore(inner: ReputationAdjustmentStore, ttl: number, clockValue: clock.Clock): ReputationAdjustmentStore {
  return new CachedReputationAdjustmentStore(
    inner,
    cache.newTtlCache<ReputationAdjustment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects reputation adjustments. Empty fields match all. */
export class ReputationAdjustmentQuery {
  locale: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCapacity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationAdjustment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationAdjustment[]): ReputationAdjustment[] {
    const matched = collections.filter(items, (candidate: ReputationAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationAdjustments(store: ReputationAdjustmentStore, query: ReputationAdjustmentQuery): ReputationAdjustment[] {
  return query.apply(store.list());
}
