import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredDomainDigest } from "./tiered-domain-digest.js";

/** Keeps tiered domain digests by code. */
export interface TieredDomainDigestStore {
  find(code: string): TieredDomainDigest | undefined;
  save(item: TieredDomainDigest): void;
  remove(code: string): boolean;
  list(): TieredDomainDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredDomainDigestStore implements TieredDomainDigestStore {
  items: Map<string, TieredDomainDigest>;
  order: string[];

  constructor(items: Map<string, TieredDomainDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredDomainDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredDomainDigest): void {
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

  list(): TieredDomainDigest[] {
    const out: TieredDomainDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredDomainDigestStore(): TieredDomainDigestStore {
  return new MemoryTieredDomainDigestStore(new Map<string, TieredDomainDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredDomainDigestStore implements TieredDomainDigestStore {
  inner: TieredDomainDigestStore;
  cache: cache.TtlCache<TieredDomainDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredDomainDigestStore,
    cacheValue: cache.TtlCache<TieredDomainDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredDomainDigest | undefined {
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

  save(item: TieredDomainDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredDomainDigest[] {
    return this.inner.list();
  }
}

export function newCachedTieredDomainDigestStore(inner: TieredDomainDigestStore, ttl: number, clockValue: clock.Clock): TieredDomainDigestStore {
  return new CachedTieredDomainDigestStore(inner, cache.newTtlCache<TieredDomainDigest>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered domain digests. Empty fields match all. */
export class TieredDomainDigestQuery {
  utmSource: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minOpenRate: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredDomainDigest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredDomainDigest[]): TieredDomainDigest[] {
    const matched = collections.filter(items, (candidate: TieredDomainDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredDomainDigests(store: TieredDomainDigestStore, query: TieredDomainDigestQuery): TieredDomainDigest[] {
  return query.apply(store.list());
}
