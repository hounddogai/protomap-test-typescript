import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedStreakDigest } from "./capped-streak-digest.js";

/** Keeps capped streak digests by code. */
export interface CappedStreakDigestStore {
  find(code: string): CappedStreakDigest | undefined;
  save(item: CappedStreakDigest): void;
  remove(code: string): boolean;
  list(): CappedStreakDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedStreakDigestStore implements CappedStreakDigestStore {
  items: Map<string, CappedStreakDigest>;
  order: string[];

  constructor(items: Map<string, CappedStreakDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedStreakDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedStreakDigest): void {
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

  list(): CappedStreakDigest[] {
    const out: CappedStreakDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedStreakDigestStore(): CappedStreakDigestStore {
  return new MemoryCappedStreakDigestStore(new Map<string, CappedStreakDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedStreakDigestStore implements CappedStreakDigestStore {
  inner: CappedStreakDigestStore;
  cache: cache.TtlCache<CappedStreakDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedStreakDigestStore,
    cacheValue: cache.TtlCache<CappedStreakDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedStreakDigest | undefined {
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

  save(item: CappedStreakDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedStreakDigest[] {
    return this.inner.list();
  }
}

export function newCachedCappedStreakDigestStore(inner: CappedStreakDigestStore, ttl: number, clockValue: clock.Clock): CappedStreakDigestStore {
  return new CachedCappedStreakDigestStore(inner, cache.newTtlCache<CappedStreakDigest>(128, ttl, clockValue), 0, 0);
}

/** Selects capped streak digests. Empty fields match all. */
export class CappedStreakDigestQuery {
  locale: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDiscount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedStreakDigest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedStreakDigest[]): CappedStreakDigest[] {
    const matched = collections.filter(items, (candidate: CappedStreakDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedStreakDigests(store: CappedStreakDigestStore, query: CappedStreakDigestQuery): CappedStreakDigest[] {
  return query.apply(store.list());
}
