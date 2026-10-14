import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatDigest } from "./csat-digest.js";

/** Keeps csat digests by code. */
export interface CsatDigestStore {
  find(code: string): CsatDigest | undefined;
  save(item: CsatDigest): void;
  remove(code: string): boolean;
  list(): CsatDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatDigestStore implements CsatDigestStore {
  items: Map<string, CsatDigest>;
  order: string[];

  constructor(items: Map<string, CsatDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatDigest): void {
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

  list(): CsatDigest[] {
    const out: CsatDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatDigestStore(): CsatDigestStore {
  return new MemoryCsatDigestStore(new Map<string, CsatDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatDigestStore implements CsatDigestStore {
  inner: CsatDigestStore;
  cache: cache.TtlCache<CsatDigest>;
  hits: number;
  misses: number;

  constructor(inner: CsatDigestStore, cacheValue: cache.TtlCache<CsatDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatDigest | undefined {
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

  save(item: CsatDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatDigest[] {
    return this.inner.list();
  }
}

export function newCachedCsatDigestStore(inner: CsatDigestStore, ttl: number, clockValue: clock.Clock): CsatDigestStore {
  return new CachedCsatDigestStore(inner, cache.newTtlCache<CsatDigest>(1024, ttl, clockValue), 0, 0);
}

/** Selects csat digests. Empty fields match all. */
export class CsatDigestQuery {
  locale: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minPriority: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatDigest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatDigest[]): CsatDigest[] {
    const matched = collections.filter(items, (candidate: CsatDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatDigests(store: CsatDigestStore, query: CsatDigestQuery): CsatDigest[] {
  return query.apply(store.list());
}
