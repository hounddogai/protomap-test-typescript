import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackBadgeDigest } from "./fallback-badge-digest.js";

/** Keeps fallback badge digests by code. */
export interface FallbackBadgeDigestStore {
  find(code: string): FallbackBadgeDigest | undefined;
  save(item: FallbackBadgeDigest): void;
  remove(code: string): boolean;
  list(): FallbackBadgeDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackBadgeDigestStore implements FallbackBadgeDigestStore {
  items: Map<string, FallbackBadgeDigest>;
  order: string[];

  constructor(items: Map<string, FallbackBadgeDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackBadgeDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackBadgeDigest): void {
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

  list(): FallbackBadgeDigest[] {
    const out: FallbackBadgeDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackBadgeDigestStore(): FallbackBadgeDigestStore {
  return new MemoryFallbackBadgeDigestStore(new Map<string, FallbackBadgeDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackBadgeDigestStore implements FallbackBadgeDigestStore {
  inner: FallbackBadgeDigestStore;
  cache: cache.TtlCache<FallbackBadgeDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackBadgeDigestStore,
    cacheValue: cache.TtlCache<FallbackBadgeDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackBadgeDigest | undefined {
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

  save(item: FallbackBadgeDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackBadgeDigest[] {
    return this.inner.list();
  }
}

export function newCachedFallbackBadgeDigestStore(inner: FallbackBadgeDigestStore, ttl: number, clockValue: clock.Clock): FallbackBadgeDigestStore {
  return new CachedFallbackBadgeDigestStore(inner, cache.newTtlCache<FallbackBadgeDigest>(256, ttl, clockValue), 0, 0);
}

/** Selects fallback badge digests. Empty fields match all. */
export class FallbackBadgeDigestQuery {
  locale: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackBadgeDigest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackBadgeDigest[]): FallbackBadgeDigest[] {
    const matched = collections.filter(items, (candidate: FallbackBadgeDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackBadgeDigests(store: FallbackBadgeDigestStore, query: FallbackBadgeDigestQuery): FallbackBadgeDigest[] {
  return query.apply(store.list());
}
