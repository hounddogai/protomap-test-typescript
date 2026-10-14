import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPlacementAdjustment } from "./default-placement-adjustment.js";

/** Keeps default placement adjustments by code. */
export interface DefaultPlacementAdjustmentStore {
  find(code: string): DefaultPlacementAdjustment | undefined;
  save(item: DefaultPlacementAdjustment): void;
  remove(code: string): boolean;
  list(): DefaultPlacementAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPlacementAdjustmentStore implements DefaultPlacementAdjustmentStore {
  items: Map<string, DefaultPlacementAdjustment>;
  order: string[];

  constructor(items: Map<string, DefaultPlacementAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPlacementAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPlacementAdjustment): void {
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

  list(): DefaultPlacementAdjustment[] {
    const out: DefaultPlacementAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPlacementAdjustmentStore(): DefaultPlacementAdjustmentStore {
  return new MemoryDefaultPlacementAdjustmentStore(new Map<string, DefaultPlacementAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPlacementAdjustmentStore implements DefaultPlacementAdjustmentStore {
  inner: DefaultPlacementAdjustmentStore;
  cache: cache.TtlCache<DefaultPlacementAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPlacementAdjustmentStore,
    cacheValue: cache.TtlCache<DefaultPlacementAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPlacementAdjustment | undefined {
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

  save(item: DefaultPlacementAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPlacementAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPlacementAdjustmentStore(inner: DefaultPlacementAdjustmentStore, ttl: number, clockValue: clock.Clock): DefaultPlacementAdjustmentStore {
  return new CachedDefaultPlacementAdjustmentStore(
    inner,
    cache.newTtlCache<DefaultPlacementAdjustment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default placement adjustments. Empty fields match all. */
export class DefaultPlacementAdjustmentQuery {
  category: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minAmount: number, statuses: string[], limit: number) {
    this.category = category;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPlacementAdjustment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPlacementAdjustment[]): DefaultPlacementAdjustment[] {
    const matched = collections.filter(items, (candidate: DefaultPlacementAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPlacementAdjustments(store: DefaultPlacementAdjustmentStore, query: DefaultPlacementAdjustmentQuery): DefaultPlacementAdjustment[] {
  return query.apply(store.list());
}
