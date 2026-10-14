import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentBundle } from "./enrollment-bundle.js";

/** Keeps enrollment bundles by code. */
export interface EnrollmentBundleStore {
  find(code: string): EnrollmentBundle | undefined;
  save(item: EnrollmentBundle): void;
  remove(code: string): boolean;
  list(): EnrollmentBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentBundleStore implements EnrollmentBundleStore {
  items: Map<string, EnrollmentBundle>;
  order: string[];

  constructor(items: Map<string, EnrollmentBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentBundle): void {
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

  list(): EnrollmentBundle[] {
    const out: EnrollmentBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentBundleStore(): EnrollmentBundleStore {
  return new MemoryEnrollmentBundleStore(new Map<string, EnrollmentBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentBundleStore implements EnrollmentBundleStore {
  inner: EnrollmentBundleStore;
  cache: cache.TtlCache<EnrollmentBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentBundleStore,
    cacheValue: cache.TtlCache<EnrollmentBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentBundle | undefined {
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

  save(item: EnrollmentBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentBundle[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentBundleStore(inner: EnrollmentBundleStore, ttl: number, clockValue: clock.Clock): EnrollmentBundleStore {
  return new CachedEnrollmentBundleStore(inner, cache.newTtlCache<EnrollmentBundle>(256, ttl, clockValue), 0, 0);
}

/** Selects enrollment bundles. Empty fields match all. */
export class EnrollmentBundleQuery {
  source: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minStartsAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentBundle): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentBundle[]): EnrollmentBundle[] {
    const matched = collections.filter(items, (candidate: EnrollmentBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentBundles(store: EnrollmentBundleStore, query: EnrollmentBundleQuery): EnrollmentBundle[] {
  return query.apply(store.list());
}
