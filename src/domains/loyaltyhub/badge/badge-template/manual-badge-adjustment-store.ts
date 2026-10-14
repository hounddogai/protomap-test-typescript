import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualBadgeAdjustment } from "./manual-badge-adjustment.js";

/** Keeps manual badge adjustments by code. */
export interface ManualBadgeAdjustmentStore {
  find(code: string): ManualBadgeAdjustment | undefined;
  save(item: ManualBadgeAdjustment): void;
  remove(code: string): boolean;
  list(): ManualBadgeAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualBadgeAdjustmentStore implements ManualBadgeAdjustmentStore {
  items: Map<string, ManualBadgeAdjustment>;
  order: string[];

  constructor(items: Map<string, ManualBadgeAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualBadgeAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualBadgeAdjustment): void {
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

  list(): ManualBadgeAdjustment[] {
    const out: ManualBadgeAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualBadgeAdjustmentStore(): ManualBadgeAdjustmentStore {
  return new MemoryManualBadgeAdjustmentStore(new Map<string, ManualBadgeAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualBadgeAdjustmentStore implements ManualBadgeAdjustmentStore {
  inner: ManualBadgeAdjustmentStore;
  cache: cache.TtlCache<ManualBadgeAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualBadgeAdjustmentStore,
    cacheValue: cache.TtlCache<ManualBadgeAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualBadgeAdjustment | undefined {
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

  save(item: ManualBadgeAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualBadgeAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedManualBadgeAdjustmentStore(inner: ManualBadgeAdjustmentStore, ttl: number, clockValue: clock.Clock): ManualBadgeAdjustmentStore {
  return new CachedManualBadgeAdjustmentStore(
    inner,
    cache.newTtlCache<ManualBadgeAdjustment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual badge adjustments. Empty fields match all. */
export class ManualBadgeAdjustmentQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualBadgeAdjustment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualBadgeAdjustment[]): ManualBadgeAdjustment[] {
    const matched = collections.filter(items, (candidate: ManualBadgeAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualBadgeAdjustments(store: ManualBadgeAdjustmentStore, query: ManualBadgeAdjustmentQuery): ManualBadgeAdjustment[] {
  return query.apply(store.list());
}
