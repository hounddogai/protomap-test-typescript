import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionAdjustment } from "./redemption-adjustment.js";

/** Keeps redemption adjustments by code. */
export interface RedemptionAdjustmentStore {
  find(code: string): RedemptionAdjustment | undefined;
  save(item: RedemptionAdjustment): void;
  remove(code: string): boolean;
  list(): RedemptionAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionAdjustmentStore implements RedemptionAdjustmentStore {
  items: Map<string, RedemptionAdjustment>;
  order: string[];

  constructor(items: Map<string, RedemptionAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionAdjustment): void {
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

  list(): RedemptionAdjustment[] {
    const out: RedemptionAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionAdjustmentStore(): RedemptionAdjustmentStore {
  return new MemoryRedemptionAdjustmentStore(new Map<string, RedemptionAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionAdjustmentStore implements RedemptionAdjustmentStore {
  inner: RedemptionAdjustmentStore;
  cache: cache.TtlCache<RedemptionAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionAdjustmentStore,
    cacheValue: cache.TtlCache<RedemptionAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionAdjustment | undefined {
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

  save(item: RedemptionAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionAdjustmentStore(inner: RedemptionAdjustmentStore, ttl: number, clockValue: clock.Clock): RedemptionAdjustmentStore {
  return new CachedRedemptionAdjustmentStore(
    inner,
    cache.newTtlCache<RedemptionAdjustment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects redemption adjustments. Empty fields match all. */
export class RedemptionAdjustmentQuery {
  name: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minStartsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionAdjustment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionAdjustment[]): RedemptionAdjustment[] {
    const matched = collections.filter(items, (candidate: RedemptionAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionAdjustments(store: RedemptionAdjustmentStore, query: RedemptionAdjustmentQuery): RedemptionAdjustment[] {
  return query.apply(store.list());
}
