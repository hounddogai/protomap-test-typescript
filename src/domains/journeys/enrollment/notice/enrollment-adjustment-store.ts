import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentAdjustment } from "./enrollment-adjustment.js";

/** Keeps enrollment adjustments by code. */
export interface EnrollmentAdjustmentStore {
  find(code: string): EnrollmentAdjustment | undefined;
  save(item: EnrollmentAdjustment): void;
  remove(code: string): boolean;
  list(): EnrollmentAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentAdjustmentStore implements EnrollmentAdjustmentStore {
  items: Map<string, EnrollmentAdjustment>;
  order: string[];

  constructor(items: Map<string, EnrollmentAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentAdjustment): void {
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

  list(): EnrollmentAdjustment[] {
    const out: EnrollmentAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentAdjustmentStore(): EnrollmentAdjustmentStore {
  return new MemoryEnrollmentAdjustmentStore(new Map<string, EnrollmentAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentAdjustmentStore implements EnrollmentAdjustmentStore {
  inner: EnrollmentAdjustmentStore;
  cache: cache.TtlCache<EnrollmentAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentAdjustmentStore,
    cacheValue: cache.TtlCache<EnrollmentAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentAdjustment | undefined {
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

  save(item: EnrollmentAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentAdjustmentStore(inner: EnrollmentAdjustmentStore, ttl: number, clockValue: clock.Clock): EnrollmentAdjustmentStore {
  return new CachedEnrollmentAdjustmentStore(
    inner,
    cache.newTtlCache<EnrollmentAdjustment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects enrollment adjustments. Empty fields match all. */
export class EnrollmentAdjustmentQuery {
  title: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSendAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentAdjustment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentAdjustment[]): EnrollmentAdjustment[] {
    const matched = collections.filter(items, (candidate: EnrollmentAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentAdjustments(store: EnrollmentAdjustmentStore, query: EnrollmentAdjustmentQuery): EnrollmentAdjustment[] {
  return query.apply(store.list());
}
