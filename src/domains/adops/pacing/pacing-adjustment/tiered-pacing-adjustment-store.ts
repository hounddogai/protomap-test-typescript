import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPacingAdjustment } from "./tiered-pacing-adjustment.js";

/** Keeps tiered pacing adjustments by code. */
export interface TieredPacingAdjustmentStore {
  find(code: string): TieredPacingAdjustment | undefined;
  save(item: TieredPacingAdjustment): void;
  remove(code: string): boolean;
  list(): TieredPacingAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPacingAdjustmentStore implements TieredPacingAdjustmentStore {
  items: Map<string, TieredPacingAdjustment>;
  order: string[];

  constructor(items: Map<string, TieredPacingAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPacingAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPacingAdjustment): void {
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

  list(): TieredPacingAdjustment[] {
    const out: TieredPacingAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPacingAdjustmentStore(): TieredPacingAdjustmentStore {
  return new MemoryTieredPacingAdjustmentStore(new Map<string, TieredPacingAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPacingAdjustmentStore implements TieredPacingAdjustmentStore {
  inner: TieredPacingAdjustmentStore;
  cache: cache.TtlCache<TieredPacingAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPacingAdjustmentStore,
    cacheValue: cache.TtlCache<TieredPacingAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPacingAdjustment | undefined {
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

  save(item: TieredPacingAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPacingAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedTieredPacingAdjustmentStore(inner: TieredPacingAdjustmentStore, ttl: number, clockValue: clock.Clock): TieredPacingAdjustmentStore {
  return new CachedTieredPacingAdjustmentStore(
    inner,
    cache.newTtlCache<TieredPacingAdjustment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered pacing adjustments. Empty fields match all. */
export class TieredPacingAdjustmentQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPacingAdjustment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPacingAdjustment[]): TieredPacingAdjustment[] {
    const matched = collections.filter(items, (candidate: TieredPacingAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPacingAdjustments(store: TieredPacingAdjustmentStore, query: TieredPacingAdjustmentQuery): TieredPacingAdjustment[] {
  return query.apply(store.list());
}
