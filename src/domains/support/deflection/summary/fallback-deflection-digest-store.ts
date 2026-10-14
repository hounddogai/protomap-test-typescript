import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackDeflectionDigest } from "./fallback-deflection-digest.js";

/** Keeps fallback deflection digests by code. */
export interface FallbackDeflectionDigestStore {
  find(code: string): FallbackDeflectionDigest | undefined;
  save(item: FallbackDeflectionDigest): void;
  remove(code: string): boolean;
  list(): FallbackDeflectionDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackDeflectionDigestStore implements FallbackDeflectionDigestStore {
  items: Map<string, FallbackDeflectionDigest>;
  order: string[];

  constructor(items: Map<string, FallbackDeflectionDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackDeflectionDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackDeflectionDigest): void {
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

  list(): FallbackDeflectionDigest[] {
    const out: FallbackDeflectionDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackDeflectionDigestStore(): FallbackDeflectionDigestStore {
  return new MemoryFallbackDeflectionDigestStore(new Map<string, FallbackDeflectionDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackDeflectionDigestStore implements FallbackDeflectionDigestStore {
  inner: FallbackDeflectionDigestStore;
  cache: cache.TtlCache<FallbackDeflectionDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackDeflectionDigestStore,
    cacheValue: cache.TtlCache<FallbackDeflectionDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackDeflectionDigest | undefined {
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

  save(item: FallbackDeflectionDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackDeflectionDigest[] {
    return this.inner.list();
  }
}

export function newCachedFallbackDeflectionDigestStore(inner: FallbackDeflectionDigestStore, ttl: number, clockValue: clock.Clock): FallbackDeflectionDigestStore {
  return new CachedFallbackDeflectionDigestStore(
    inner,
    cache.newTtlCache<FallbackDeflectionDigest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback deflection digests. Empty fields match all. */
export class FallbackDeflectionDigestQuery {
  locale: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minImpressions: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackDeflectionDigest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackDeflectionDigest[]): FallbackDeflectionDigest[] {
    const matched = collections.filter(items, (candidate: FallbackDeflectionDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackDeflectionDigests(store: FallbackDeflectionDigestStore, query: FallbackDeflectionDigestQuery): FallbackDeflectionDigest[] {
  return query.apply(store.list());
}
