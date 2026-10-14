import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingRetentionAdjustment } from "./pending-retention-adjustment.js";

/** Keeps pending retention adjustments by code. */
export interface PendingRetentionAdjustmentStore {
  find(code: string): PendingRetentionAdjustment | undefined;
  save(item: PendingRetentionAdjustment): void;
  remove(code: string): boolean;
  list(): PendingRetentionAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingRetentionAdjustmentStore implements PendingRetentionAdjustmentStore {
  items: Map<string, PendingRetentionAdjustment>;
  order: string[];

  constructor(items: Map<string, PendingRetentionAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingRetentionAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingRetentionAdjustment): void {
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

  list(): PendingRetentionAdjustment[] {
    const out: PendingRetentionAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingRetentionAdjustmentStore(): PendingRetentionAdjustmentStore {
  return new MemoryPendingRetentionAdjustmentStore(new Map<string, PendingRetentionAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingRetentionAdjustmentStore implements PendingRetentionAdjustmentStore {
  inner: PendingRetentionAdjustmentStore;
  cache: cache.TtlCache<PendingRetentionAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingRetentionAdjustmentStore,
    cacheValue: cache.TtlCache<PendingRetentionAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingRetentionAdjustment | undefined {
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

  save(item: PendingRetentionAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingRetentionAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedPendingRetentionAdjustmentStore(inner: PendingRetentionAdjustmentStore, ttl: number, clockValue: clock.Clock): PendingRetentionAdjustmentStore {
  return new CachedPendingRetentionAdjustmentStore(
    inner,
    cache.newTtlCache<PendingRetentionAdjustment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending retention adjustments. Empty fields match all. */
export class PendingRetentionAdjustmentQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingRetentionAdjustment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingRetentionAdjustment[]): PendingRetentionAdjustment[] {
    const matched = collections.filter(items, (candidate: PendingRetentionAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingRetentionAdjustments(store: PendingRetentionAdjustmentStore, query: PendingRetentionAdjustmentQuery): PendingRetentionAdjustment[] {
  return query.apply(store.list());
}
