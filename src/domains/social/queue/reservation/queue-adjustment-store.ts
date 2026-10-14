import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueAdjustment } from "./queue-adjustment.js";

/** Keeps queue adjustments by code. */
export interface QueueAdjustmentStore {
  find(code: string): QueueAdjustment | undefined;
  save(item: QueueAdjustment): void;
  remove(code: string): boolean;
  list(): QueueAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueAdjustmentStore implements QueueAdjustmentStore {
  items: Map<string, QueueAdjustment>;
  order: string[];

  constructor(items: Map<string, QueueAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueAdjustment): void {
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

  list(): QueueAdjustment[] {
    const out: QueueAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueAdjustmentStore(): QueueAdjustmentStore {
  return new MemoryQueueAdjustmentStore(new Map<string, QueueAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueAdjustmentStore implements QueueAdjustmentStore {
  inner: QueueAdjustmentStore;
  cache: cache.TtlCache<QueueAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: QueueAdjustmentStore,
    cacheValue: cache.TtlCache<QueueAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueAdjustment | undefined {
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

  save(item: QueueAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedQueueAdjustmentStore(inner: QueueAdjustmentStore, ttl: number, clockValue: clock.Clock): QueueAdjustmentStore {
  return new CachedQueueAdjustmentStore(inner, cache.newTtlCache<QueueAdjustment>(512, ttl, clockValue), 0, 0);
}

/** Selects queue adjustments. Empty fields match all. */
export class QueueAdjustmentQuery {
  locale: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFloorValue: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueAdjustment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueAdjustment[]): QueueAdjustment[] {
    const matched = collections.filter(items, (candidate: QueueAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueAdjustments(store: QueueAdjustmentStore, query: QueueAdjustmentQuery): QueueAdjustment[] {
  return query.apply(store.list());
}
