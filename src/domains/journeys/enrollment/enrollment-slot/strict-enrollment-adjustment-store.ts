import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictEnrollmentAdjustment } from "./strict-enrollment-adjustment.js";

/** Keeps strict enrollment adjustments by code. */
export interface StrictEnrollmentAdjustmentStore {
  find(code: string): StrictEnrollmentAdjustment | undefined;
  save(item: StrictEnrollmentAdjustment): void;
  remove(code: string): boolean;
  list(): StrictEnrollmentAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictEnrollmentAdjustmentStore implements StrictEnrollmentAdjustmentStore {
  items: Map<string, StrictEnrollmentAdjustment>;
  order: string[];

  constructor(items: Map<string, StrictEnrollmentAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictEnrollmentAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictEnrollmentAdjustment): void {
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

  list(): StrictEnrollmentAdjustment[] {
    const out: StrictEnrollmentAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictEnrollmentAdjustmentStore(): StrictEnrollmentAdjustmentStore {
  return new MemoryStrictEnrollmentAdjustmentStore(new Map<string, StrictEnrollmentAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictEnrollmentAdjustmentStore implements StrictEnrollmentAdjustmentStore {
  inner: StrictEnrollmentAdjustmentStore;
  cache: cache.TtlCache<StrictEnrollmentAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictEnrollmentAdjustmentStore,
    cacheValue: cache.TtlCache<StrictEnrollmentAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictEnrollmentAdjustment | undefined {
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

  save(item: StrictEnrollmentAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictEnrollmentAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedStrictEnrollmentAdjustmentStore(inner: StrictEnrollmentAdjustmentStore, ttl: number, clockValue: clock.Clock): StrictEnrollmentAdjustmentStore {
  return new CachedStrictEnrollmentAdjustmentStore(
    inner,
    cache.newTtlCache<StrictEnrollmentAdjustment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict enrollment adjustments. Empty fields match all. */
export class StrictEnrollmentAdjustmentQuery {
  name: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMinimum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictEnrollmentAdjustment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictEnrollmentAdjustment[]): StrictEnrollmentAdjustment[] {
    const matched = collections.filter(items, (candidate: StrictEnrollmentAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictEnrollmentAdjustments(store: StrictEnrollmentAdjustmentStore, query: StrictEnrollmentAdjustmentQuery): StrictEnrollmentAdjustment[] {
  return query.apply(store.list());
}
