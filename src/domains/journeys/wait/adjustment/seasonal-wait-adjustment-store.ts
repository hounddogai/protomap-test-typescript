import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalWaitAdjustment } from "./seasonal-wait-adjustment.js";

/** Keeps seasonal wait adjustments by code. */
export interface SeasonalWaitAdjustmentStore {
  find(code: string): SeasonalWaitAdjustment | undefined;
  save(item: SeasonalWaitAdjustment): void;
  remove(code: string): boolean;
  list(): SeasonalWaitAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalWaitAdjustmentStore implements SeasonalWaitAdjustmentStore {
  items: Map<string, SeasonalWaitAdjustment>;
  order: string[];

  constructor(items: Map<string, SeasonalWaitAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalWaitAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalWaitAdjustment): void {
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

  list(): SeasonalWaitAdjustment[] {
    const out: SeasonalWaitAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalWaitAdjustmentStore(): SeasonalWaitAdjustmentStore {
  return new MemorySeasonalWaitAdjustmentStore(new Map<string, SeasonalWaitAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalWaitAdjustmentStore implements SeasonalWaitAdjustmentStore {
  inner: SeasonalWaitAdjustmentStore;
  cache: cache.TtlCache<SeasonalWaitAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalWaitAdjustmentStore,
    cacheValue: cache.TtlCache<SeasonalWaitAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalWaitAdjustment | undefined {
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

  save(item: SeasonalWaitAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalWaitAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalWaitAdjustmentStore(inner: SeasonalWaitAdjustmentStore, ttl: number, clockValue: clock.Clock): SeasonalWaitAdjustmentStore {
  return new CachedSeasonalWaitAdjustmentStore(
    inner,
    cache.newTtlCache<SeasonalWaitAdjustment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal wait adjustments. Empty fields match all. */
export class SeasonalWaitAdjustmentQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalWaitAdjustment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalWaitAdjustment[]): SeasonalWaitAdjustment[] {
    const matched = collections.filter(items, (candidate: SeasonalWaitAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalWaitAdjustments(store: SeasonalWaitAdjustmentStore, query: SeasonalWaitAdjustmentQuery): SeasonalWaitAdjustment[] {
  return query.apply(store.list());
}
