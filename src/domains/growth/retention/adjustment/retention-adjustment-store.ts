import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionAdjustment } from "./retention-adjustment.js";

/** Keeps retention adjustments by code. */
export interface RetentionAdjustmentStore {
  find(code: string): RetentionAdjustment | undefined;
  save(item: RetentionAdjustment): void;
  remove(code: string): boolean;
  list(): RetentionAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionAdjustmentStore implements RetentionAdjustmentStore {
  items: Map<string, RetentionAdjustment>;
  order: string[];

  constructor(items: Map<string, RetentionAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionAdjustment): void {
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

  list(): RetentionAdjustment[] {
    const out: RetentionAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionAdjustmentStore(): RetentionAdjustmentStore {
  return new MemoryRetentionAdjustmentStore(new Map<string, RetentionAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionAdjustmentStore implements RetentionAdjustmentStore {
  inner: RetentionAdjustmentStore;
  cache: cache.TtlCache<RetentionAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionAdjustmentStore,
    cacheValue: cache.TtlCache<RetentionAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionAdjustment | undefined {
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

  save(item: RetentionAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedRetentionAdjustmentStore(inner: RetentionAdjustmentStore, ttl: number, clockValue: clock.Clock): RetentionAdjustmentStore {
  return new CachedRetentionAdjustmentStore(inner, cache.newTtlCache<RetentionAdjustment>(128, ttl, clockValue), 0, 0);
}

/** Selects retention adjustments. Empty fields match all. */
export class RetentionAdjustmentQuery {
  title: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRetries: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionAdjustment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionAdjustment[]): RetentionAdjustment[] {
    const matched = collections.filter(items, (candidate: RetentionAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionAdjustments(store: RetentionAdjustmentStore, query: RetentionAdjustmentQuery): RetentionAdjustment[] {
  return query.apply(store.list());
}
