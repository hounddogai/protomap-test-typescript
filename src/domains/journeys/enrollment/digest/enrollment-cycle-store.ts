import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentCycle } from "./enrollment-cycle.js";

/** Keeps enrollment cycles by code. */
export interface EnrollmentCycleStore {
  find(code: string): EnrollmentCycle | undefined;
  save(item: EnrollmentCycle): void;
  remove(code: string): boolean;
  list(): EnrollmentCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentCycleStore implements EnrollmentCycleStore {
  items: Map<string, EnrollmentCycle>;
  order: string[];

  constructor(items: Map<string, EnrollmentCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentCycle): void {
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

  list(): EnrollmentCycle[] {
    const out: EnrollmentCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentCycleStore(): EnrollmentCycleStore {
  return new MemoryEnrollmentCycleStore(new Map<string, EnrollmentCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentCycleStore implements EnrollmentCycleStore {
  inner: EnrollmentCycleStore;
  cache: cache.TtlCache<EnrollmentCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentCycleStore,
    cacheValue: cache.TtlCache<EnrollmentCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentCycle | undefined {
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

  save(item: EnrollmentCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentCycle[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentCycleStore(inner: EnrollmentCycleStore, ttl: number, clockValue: clock.Clock): EnrollmentCycleStore {
  return new CachedEnrollmentCycleStore(inner, cache.newTtlCache<EnrollmentCycle>(1024, ttl, clockValue), 0, 0);
}

/** Selects enrollment cycles. Empty fields match all. */
export class EnrollmentCycleQuery {
  locale: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minClicks: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentCycle): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentCycle[]): EnrollmentCycle[] {
    const matched = collections.filter(items, (candidate: EnrollmentCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentCycles(store: EnrollmentCycleStore, query: EnrollmentCycleQuery): EnrollmentCycle[] {
  return query.apply(store.list());
}
