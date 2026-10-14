import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredModelDigest } from "./tiered-model-digest.js";

/** Keeps tiered model digests by code. */
export interface TieredModelDigestStore {
  find(code: string): TieredModelDigest | undefined;
  save(item: TieredModelDigest): void;
  remove(code: string): boolean;
  list(): TieredModelDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredModelDigestStore implements TieredModelDigestStore {
  items: Map<string, TieredModelDigest>;
  order: string[];

  constructor(items: Map<string, TieredModelDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredModelDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredModelDigest): void {
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

  list(): TieredModelDigest[] {
    const out: TieredModelDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredModelDigestStore(): TieredModelDigestStore {
  return new MemoryTieredModelDigestStore(new Map<string, TieredModelDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredModelDigestStore implements TieredModelDigestStore {
  inner: TieredModelDigestStore;
  cache: cache.TtlCache<TieredModelDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredModelDigestStore,
    cacheValue: cache.TtlCache<TieredModelDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredModelDigest | undefined {
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

  save(item: TieredModelDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredModelDigest[] {
    return this.inner.list();
  }
}

export function newCachedTieredModelDigestStore(inner: TieredModelDigestStore, ttl: number, clockValue: clock.Clock): TieredModelDigestStore {
  return new CachedTieredModelDigestStore(inner, cache.newTtlCache<TieredModelDigest>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered model digests. Empty fields match all. */
export class TieredModelDigestQuery {
  utmSource: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRate: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredModelDigest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredModelDigest[]): TieredModelDigest[] {
    const matched = collections.filter(items, (candidate: TieredModelDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredModelDigests(store: TieredModelDigestStore, query: TieredModelDigestQuery): TieredModelDigest[] {
  return query.apply(store.list());
}
