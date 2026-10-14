import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryCreativeDigest } from "./primary-creative-digest.js";

/** Keeps primary creative digests by code. */
export interface PrimaryCreativeDigestStore {
  find(code: string): PrimaryCreativeDigest | undefined;
  save(item: PrimaryCreativeDigest): void;
  remove(code: string): boolean;
  list(): PrimaryCreativeDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryCreativeDigestStore implements PrimaryCreativeDigestStore {
  items: Map<string, PrimaryCreativeDigest>;
  order: string[];

  constructor(items: Map<string, PrimaryCreativeDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryCreativeDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryCreativeDigest): void {
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

  list(): PrimaryCreativeDigest[] {
    const out: PrimaryCreativeDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryCreativeDigestStore(): PrimaryCreativeDigestStore {
  return new MemoryPrimaryCreativeDigestStore(new Map<string, PrimaryCreativeDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryCreativeDigestStore implements PrimaryCreativeDigestStore {
  inner: PrimaryCreativeDigestStore;
  cache: cache.TtlCache<PrimaryCreativeDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryCreativeDigestStore,
    cacheValue: cache.TtlCache<PrimaryCreativeDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryCreativeDigest | undefined {
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

  save(item: PrimaryCreativeDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryCreativeDigest[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryCreativeDigestStore(inner: PrimaryCreativeDigestStore, ttl: number, clockValue: clock.Clock): PrimaryCreativeDigestStore {
  return new CachedPrimaryCreativeDigestStore(
    inner,
    cache.newTtlCache<PrimaryCreativeDigest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary creative digests. Empty fields match all. */
export class PrimaryCreativeDigestQuery {
  source: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minMinimum: number, statuses: string[], limit: number) {
    this.source = source;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryCreativeDigest): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryCreativeDigest[]): PrimaryCreativeDigest[] {
    const matched = collections.filter(items, (candidate: PrimaryCreativeDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryCreativeDigests(store: PrimaryCreativeDigestStore, query: PrimaryCreativeDigestQuery): PrimaryCreativeDigest[] {
  return query.apply(store.list());
}
