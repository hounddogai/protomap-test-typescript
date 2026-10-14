import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictEnrollmentDigest } from "./strict-enrollment-digest.js";

/** Keeps strict enrollment digests by code. */
export interface StrictEnrollmentDigestStore {
  find(code: string): StrictEnrollmentDigest | undefined;
  save(item: StrictEnrollmentDigest): void;
  remove(code: string): boolean;
  list(): StrictEnrollmentDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictEnrollmentDigestStore implements StrictEnrollmentDigestStore {
  items: Map<string, StrictEnrollmentDigest>;
  order: string[];

  constructor(items: Map<string, StrictEnrollmentDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictEnrollmentDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictEnrollmentDigest): void {
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

  list(): StrictEnrollmentDigest[] {
    const out: StrictEnrollmentDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictEnrollmentDigestStore(): StrictEnrollmentDigestStore {
  return new MemoryStrictEnrollmentDigestStore(new Map<string, StrictEnrollmentDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictEnrollmentDigestStore implements StrictEnrollmentDigestStore {
  inner: StrictEnrollmentDigestStore;
  cache: cache.TtlCache<StrictEnrollmentDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictEnrollmentDigestStore,
    cacheValue: cache.TtlCache<StrictEnrollmentDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictEnrollmentDigest | undefined {
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

  save(item: StrictEnrollmentDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictEnrollmentDigest[] {
    return this.inner.list();
  }
}

export function newCachedStrictEnrollmentDigestStore(inner: StrictEnrollmentDigestStore, ttl: number, clockValue: clock.Clock): StrictEnrollmentDigestStore {
  return new CachedStrictEnrollmentDigestStore(
    inner,
    cache.newTtlCache<StrictEnrollmentDigest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict enrollment digests. Empty fields match all. */
export class StrictEnrollmentDigestQuery {
  unit: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCost: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictEnrollmentDigest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictEnrollmentDigest[]): StrictEnrollmentDigest[] {
    const matched = collections.filter(items, (candidate: StrictEnrollmentDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictEnrollmentDigests(store: StrictEnrollmentDigestStore, query: StrictEnrollmentDigestQuery): StrictEnrollmentDigest[] {
  return query.apply(store.list());
}
