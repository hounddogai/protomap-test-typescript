import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentWindow } from "./enrollment-window.js";

/** Keeps enrollment windows by code. */
export interface EnrollmentWindowStore {
  find(code: string): EnrollmentWindow | undefined;
  save(item: EnrollmentWindow): void;
  remove(code: string): boolean;
  list(): EnrollmentWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentWindowStore implements EnrollmentWindowStore {
  items: Map<string, EnrollmentWindow>;
  order: string[];

  constructor(items: Map<string, EnrollmentWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentWindow): void {
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

  list(): EnrollmentWindow[] {
    const out: EnrollmentWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentWindowStore(): EnrollmentWindowStore {
  return new MemoryEnrollmentWindowStore(new Map<string, EnrollmentWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentWindowStore implements EnrollmentWindowStore {
  inner: EnrollmentWindowStore;
  cache: cache.TtlCache<EnrollmentWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentWindowStore,
    cacheValue: cache.TtlCache<EnrollmentWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentWindow | undefined {
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

  save(item: EnrollmentWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentWindow[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentWindowStore(inner: EnrollmentWindowStore, ttl: number, clockValue: clock.Clock): EnrollmentWindowStore {
  return new CachedEnrollmentWindowStore(inner, cache.newTtlCache<EnrollmentWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects enrollment windows. Empty fields match all. */
export class EnrollmentWindowQuery {
  source: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minGraceDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentWindow): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentWindow[]): EnrollmentWindow[] {
    const matched = collections.filter(items, (candidate: EnrollmentWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentWindows(store: EnrollmentWindowStore, query: EnrollmentWindowQuery): EnrollmentWindow[] {
  return query.apply(store.list());
}
