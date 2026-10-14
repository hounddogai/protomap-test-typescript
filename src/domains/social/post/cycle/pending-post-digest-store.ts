import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPostDigest } from "./pending-post-digest.js";

/** Keeps pending post digests by code. */
export interface PendingPostDigestStore {
  find(code: string): PendingPostDigest | undefined;
  save(item: PendingPostDigest): void;
  remove(code: string): boolean;
  list(): PendingPostDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPostDigestStore implements PendingPostDigestStore {
  items: Map<string, PendingPostDigest>;
  order: string[];

  constructor(items: Map<string, PendingPostDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPostDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPostDigest): void {
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

  list(): PendingPostDigest[] {
    const out: PendingPostDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPostDigestStore(): PendingPostDigestStore {
  return new MemoryPendingPostDigestStore(new Map<string, PendingPostDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPostDigestStore implements PendingPostDigestStore {
  inner: PendingPostDigestStore;
  cache: cache.TtlCache<PendingPostDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPostDigestStore,
    cacheValue: cache.TtlCache<PendingPostDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPostDigest | undefined {
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

  save(item: PendingPostDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPostDigest[] {
    return this.inner.list();
  }
}

export function newCachedPendingPostDigestStore(inner: PendingPostDigestStore, ttl: number, clockValue: clock.Clock): PendingPostDigestStore {
  return new CachedPendingPostDigestStore(inner, cache.newTtlCache<PendingPostDigest>(64, ttl, clockValue), 0, 0);
}

/** Selects pending post digests. Empty fields match all. */
export class PendingPostDigestQuery {
  source: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minThreshold: number, statuses: string[], limit: number) {
    this.source = source;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPostDigest): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPostDigest[]): PendingPostDigest[] {
    const matched = collections.filter(items, (candidate: PendingPostDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPostDigests(store: PendingPostDigestStore, query: PendingPostDigestQuery): PendingPostDigest[] {
  return query.apply(store.list());
}
