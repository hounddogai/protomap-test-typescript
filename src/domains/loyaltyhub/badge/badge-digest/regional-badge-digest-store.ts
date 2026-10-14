import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalBadgeDigest } from "./regional-badge-digest.js";

/** Keeps regional badge digests by code. */
export interface RegionalBadgeDigestStore {
  find(code: string): RegionalBadgeDigest | undefined;
  save(item: RegionalBadgeDigest): void;
  remove(code: string): boolean;
  list(): RegionalBadgeDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalBadgeDigestStore implements RegionalBadgeDigestStore {
  items: Map<string, RegionalBadgeDigest>;
  order: string[];

  constructor(items: Map<string, RegionalBadgeDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalBadgeDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalBadgeDigest): void {
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

  list(): RegionalBadgeDigest[] {
    const out: RegionalBadgeDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalBadgeDigestStore(): RegionalBadgeDigestStore {
  return new MemoryRegionalBadgeDigestStore(new Map<string, RegionalBadgeDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalBadgeDigestStore implements RegionalBadgeDigestStore {
  inner: RegionalBadgeDigestStore;
  cache: cache.TtlCache<RegionalBadgeDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalBadgeDigestStore,
    cacheValue: cache.TtlCache<RegionalBadgeDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalBadgeDigest | undefined {
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

  save(item: RegionalBadgeDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalBadgeDigest[] {
    return this.inner.list();
  }
}

export function newCachedRegionalBadgeDigestStore(inner: RegionalBadgeDigestStore, ttl: number, clockValue: clock.Clock): RegionalBadgeDigestStore {
  return new CachedRegionalBadgeDigestStore(inner, cache.newTtlCache<RegionalBadgeDigest>(64, ttl, clockValue), 0, 0);
}

/** Selects regional badge digests. Empty fields match all. */
export class RegionalBadgeDigestQuery {
  locale: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCost: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalBadgeDigest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalBadgeDigest[]): RegionalBadgeDigest[] {
    const matched = collections.filter(items, (candidate: RegionalBadgeDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalBadgeDigests(store: RegionalBadgeDigestStore, query: RegionalBadgeDigestQuery): RegionalBadgeDigest[] {
  return query.apply(store.list());
}
