import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingSlaAdjustment } from "./pending-sla-adjustment.js";

/** Keeps pending sla adjustments by code. */
export interface PendingSlaAdjustmentStore {
  find(code: string): PendingSlaAdjustment | undefined;
  save(item: PendingSlaAdjustment): void;
  remove(code: string): boolean;
  list(): PendingSlaAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingSlaAdjustmentStore implements PendingSlaAdjustmentStore {
  items: Map<string, PendingSlaAdjustment>;
  order: string[];

  constructor(items: Map<string, PendingSlaAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingSlaAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingSlaAdjustment): void {
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

  list(): PendingSlaAdjustment[] {
    const out: PendingSlaAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingSlaAdjustmentStore(): PendingSlaAdjustmentStore {
  return new MemoryPendingSlaAdjustmentStore(new Map<string, PendingSlaAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingSlaAdjustmentStore implements PendingSlaAdjustmentStore {
  inner: PendingSlaAdjustmentStore;
  cache: cache.TtlCache<PendingSlaAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingSlaAdjustmentStore,
    cacheValue: cache.TtlCache<PendingSlaAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingSlaAdjustment | undefined {
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

  save(item: PendingSlaAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingSlaAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedPendingSlaAdjustmentStore(inner: PendingSlaAdjustmentStore, ttl: number, clockValue: clock.Clock): PendingSlaAdjustmentStore {
  return new CachedPendingSlaAdjustmentStore(
    inner,
    cache.newTtlCache<PendingSlaAdjustment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending sla adjustments. Empty fields match all. */
export class PendingSlaAdjustmentQuery {
  name: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRatio: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingSlaAdjustment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingSlaAdjustment[]): PendingSlaAdjustment[] {
    const matched = collections.filter(items, (candidate: PendingSlaAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingSlaAdjustments(store: PendingSlaAdjustmentStore, query: PendingSlaAdjustmentQuery): PendingSlaAdjustment[] {
  return query.apply(store.list());
}
