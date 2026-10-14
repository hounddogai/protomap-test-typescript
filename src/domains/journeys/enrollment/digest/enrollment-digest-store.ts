import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentDigest } from "./enrollment-digest.js";

/** Keeps enrollment digests by code. */
export interface EnrollmentDigestStore {
  find(code: string): EnrollmentDigest | undefined;
  save(item: EnrollmentDigest): void;
  remove(code: string): boolean;
  list(): EnrollmentDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentDigestStore implements EnrollmentDigestStore {
  items: Map<string, EnrollmentDigest>;
  order: string[];

  constructor(items: Map<string, EnrollmentDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentDigest): void {
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

  list(): EnrollmentDigest[] {
    const out: EnrollmentDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentDigestStore(): EnrollmentDigestStore {
  return new MemoryEnrollmentDigestStore(new Map<string, EnrollmentDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentDigestStore implements EnrollmentDigestStore {
  inner: EnrollmentDigestStore;
  cache: cache.TtlCache<EnrollmentDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentDigestStore,
    cacheValue: cache.TtlCache<EnrollmentDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentDigest | undefined {
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

  save(item: EnrollmentDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentDigest[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentDigestStore(inner: EnrollmentDigestStore, ttl: number, clockValue: clock.Clock): EnrollmentDigestStore {
  return new CachedEnrollmentDigestStore(inner, cache.newTtlCache<EnrollmentDigest>(256, ttl, clockValue), 0, 0);
}

/** Selects enrollment digests. Empty fields match all. */
export class EnrollmentDigestQuery {
  region: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minLimit: number, statuses: string[], limit: number) {
    this.region = region;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentDigest): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentDigest[]): EnrollmentDigest[] {
    const matched = collections.filter(items, (candidate: EnrollmentDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentDigests(store: EnrollmentDigestStore, query: EnrollmentDigestQuery): EnrollmentDigest[] {
  return query.apply(store.list());
}
