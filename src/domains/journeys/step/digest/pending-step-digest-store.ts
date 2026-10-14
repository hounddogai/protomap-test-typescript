import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingStepDigest } from "./pending-step-digest.js";

/** Keeps pending step digests by code. */
export interface PendingStepDigestStore {
  find(code: string): PendingStepDigest | undefined;
  save(item: PendingStepDigest): void;
  remove(code: string): boolean;
  list(): PendingStepDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingStepDigestStore implements PendingStepDigestStore {
  items: Map<string, PendingStepDigest>;
  order: string[];

  constructor(items: Map<string, PendingStepDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingStepDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingStepDigest): void {
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

  list(): PendingStepDigest[] {
    const out: PendingStepDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingStepDigestStore(): PendingStepDigestStore {
  return new MemoryPendingStepDigestStore(new Map<string, PendingStepDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingStepDigestStore implements PendingStepDigestStore {
  inner: PendingStepDigestStore;
  cache: cache.TtlCache<PendingStepDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingStepDigestStore,
    cacheValue: cache.TtlCache<PendingStepDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingStepDigest | undefined {
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

  save(item: PendingStepDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingStepDigest[] {
    return this.inner.list();
  }
}

export function newCachedPendingStepDigestStore(inner: PendingStepDigestStore, ttl: number, clockValue: clock.Clock): PendingStepDigestStore {
  return new CachedPendingStepDigestStore(inner, cache.newTtlCache<PendingStepDigest>(512, ttl, clockValue), 0, 0);
}

/** Selects pending step digests. Empty fields match all. */
export class PendingStepDigestQuery {
  name: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBid: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingStepDigest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingStepDigest[]): PendingStepDigest[] {
    const matched = collections.filter(items, (candidate: PendingStepDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingStepDigests(store: PendingStepDigestStore, query: PendingStepDigestQuery): PendingStepDigest[] {
  return query.apply(store.list());
}
