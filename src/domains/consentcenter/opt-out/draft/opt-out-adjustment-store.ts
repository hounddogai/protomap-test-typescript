import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutAdjustment } from "./opt-out-adjustment.js";

/** Keeps opt out adjustments by code. */
export interface OptOutAdjustmentStore {
  find(code: string): OptOutAdjustment | undefined;
  save(item: OptOutAdjustment): void;
  remove(code: string): boolean;
  list(): OptOutAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutAdjustmentStore implements OptOutAdjustmentStore {
  items: Map<string, OptOutAdjustment>;
  order: string[];

  constructor(items: Map<string, OptOutAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutAdjustment): void {
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

  list(): OptOutAdjustment[] {
    const out: OptOutAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutAdjustmentStore(): OptOutAdjustmentStore {
  return new MemoryOptOutAdjustmentStore(new Map<string, OptOutAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutAdjustmentStore implements OptOutAdjustmentStore {
  inner: OptOutAdjustmentStore;
  cache: cache.TtlCache<OptOutAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: OptOutAdjustmentStore,
    cacheValue: cache.TtlCache<OptOutAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutAdjustment | undefined {
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

  save(item: OptOutAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedOptOutAdjustmentStore(inner: OptOutAdjustmentStore, ttl: number, clockValue: clock.Clock): OptOutAdjustmentStore {
  return new CachedOptOutAdjustmentStore(inner, cache.newTtlCache<OptOutAdjustment>(256, ttl, clockValue), 0, 0);
}

/** Selects opt out adjustments. Empty fields match all. */
export class OptOutAdjustmentQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutAdjustment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutAdjustment[]): OptOutAdjustment[] {
    const matched = collections.filter(items, (candidate: OptOutAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutAdjustments(store: OptOutAdjustmentStore, query: OptOutAdjustmentQuery): OptOutAdjustment[] {
  return query.apply(store.list());
}
