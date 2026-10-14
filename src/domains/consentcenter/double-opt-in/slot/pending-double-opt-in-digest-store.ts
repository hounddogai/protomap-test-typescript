import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingDoubleOptInDigest } from "./pending-double-opt-in-digest.js";

/** Keeps pending double opt in digests by code. */
export interface PendingDoubleOptInDigestStore {
  find(code: string): PendingDoubleOptInDigest | undefined;
  save(item: PendingDoubleOptInDigest): void;
  remove(code: string): boolean;
  list(): PendingDoubleOptInDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingDoubleOptInDigestStore implements PendingDoubleOptInDigestStore {
  items: Map<string, PendingDoubleOptInDigest>;
  order: string[];

  constructor(items: Map<string, PendingDoubleOptInDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingDoubleOptInDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingDoubleOptInDigest): void {
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

  list(): PendingDoubleOptInDigest[] {
    const out: PendingDoubleOptInDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingDoubleOptInDigestStore(): PendingDoubleOptInDigestStore {
  return new MemoryPendingDoubleOptInDigestStore(new Map<string, PendingDoubleOptInDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingDoubleOptInDigestStore implements PendingDoubleOptInDigestStore {
  inner: PendingDoubleOptInDigestStore;
  cache: cache.TtlCache<PendingDoubleOptInDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingDoubleOptInDigestStore,
    cacheValue: cache.TtlCache<PendingDoubleOptInDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingDoubleOptInDigest | undefined {
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

  save(item: PendingDoubleOptInDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingDoubleOptInDigest[] {
    return this.inner.list();
  }
}

export function newCachedPendingDoubleOptInDigestStore(inner: PendingDoubleOptInDigestStore, ttl: number, clockValue: clock.Clock): PendingDoubleOptInDigestStore {
  return new CachedPendingDoubleOptInDigestStore(
    inner,
    cache.newTtlCache<PendingDoubleOptInDigest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending double opt in digests. Empty fields match all. */
export class PendingDoubleOptInDigestQuery {
  segment: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minLimit: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingDoubleOptInDigest): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingDoubleOptInDigest[]): PendingDoubleOptInDigest[] {
    const matched = collections.filter(items, (candidate: PendingDoubleOptInDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingDoubleOptInDigests(store: PendingDoubleOptInDigestStore, query: PendingDoubleOptInDigestQuery): PendingDoubleOptInDigest[] {
  return query.apply(store.list());
}
