import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryFraudCheckDigest } from "./primary-fraud-check-digest.js";

/** Keeps primary fraud check digests by code. */
export interface PrimaryFraudCheckDigestStore {
  find(code: string): PrimaryFraudCheckDigest | undefined;
  save(item: PrimaryFraudCheckDigest): void;
  remove(code: string): boolean;
  list(): PrimaryFraudCheckDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryFraudCheckDigestStore implements PrimaryFraudCheckDigestStore {
  items: Map<string, PrimaryFraudCheckDigest>;
  order: string[];

  constructor(items: Map<string, PrimaryFraudCheckDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryFraudCheckDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryFraudCheckDigest): void {
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

  list(): PrimaryFraudCheckDigest[] {
    const out: PrimaryFraudCheckDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryFraudCheckDigestStore(): PrimaryFraudCheckDigestStore {
  return new MemoryPrimaryFraudCheckDigestStore(new Map<string, PrimaryFraudCheckDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryFraudCheckDigestStore implements PrimaryFraudCheckDigestStore {
  inner: PrimaryFraudCheckDigestStore;
  cache: cache.TtlCache<PrimaryFraudCheckDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryFraudCheckDigestStore,
    cacheValue: cache.TtlCache<PrimaryFraudCheckDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryFraudCheckDigest | undefined {
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

  save(item: PrimaryFraudCheckDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryFraudCheckDigest[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryFraudCheckDigestStore(inner: PrimaryFraudCheckDigestStore, ttl: number, clockValue: clock.Clock): PrimaryFraudCheckDigestStore {
  return new CachedPrimaryFraudCheckDigestStore(
    inner,
    cache.newTtlCache<PrimaryFraudCheckDigest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary fraud check digests. Empty fields match all. */
export class PrimaryFraudCheckDigestQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryFraudCheckDigest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryFraudCheckDigest[]): PrimaryFraudCheckDigest[] {
    const matched = collections.filter(items, (candidate: PrimaryFraudCheckDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryFraudCheckDigests(store: PrimaryFraudCheckDigestStore, query: PrimaryFraudCheckDigestQuery): PrimaryFraudCheckDigest[] {
  return query.apply(store.list());
}
