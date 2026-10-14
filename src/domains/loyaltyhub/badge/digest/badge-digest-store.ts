import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeDigest } from "./badge-digest.js";

/** Keeps badge digests by code. */
export interface BadgeDigestStore {
  find(code: string): BadgeDigest | undefined;
  save(item: BadgeDigest): void;
  remove(code: string): boolean;
  list(): BadgeDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeDigestStore implements BadgeDigestStore {
  items: Map<string, BadgeDigest>;
  order: string[];

  constructor(items: Map<string, BadgeDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeDigest): void {
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

  list(): BadgeDigest[] {
    const out: BadgeDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeDigestStore(): BadgeDigestStore {
  return new MemoryBadgeDigestStore(new Map<string, BadgeDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeDigestStore implements BadgeDigestStore {
  inner: BadgeDigestStore;
  cache: cache.TtlCache<BadgeDigest>;
  hits: number;
  misses: number;

  constructor(inner: BadgeDigestStore, cacheValue: cache.TtlCache<BadgeDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeDigest | undefined {
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

  save(item: BadgeDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeDigest[] {
    return this.inner.list();
  }
}

export function newCachedBadgeDigestStore(inner: BadgeDigestStore, ttl: number, clockValue: clock.Clock): BadgeDigestStore {
  return new CachedBadgeDigestStore(inner, cache.newTtlCache<BadgeDigest>(1024, ttl, clockValue), 0, 0);
}

/** Selects badge digests. Empty fields match all. */
export class BadgeDigestQuery {
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

  matches(item: BadgeDigest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeDigest[]): BadgeDigest[] {
    const matched = collections.filter(items, (candidate: BadgeDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeDigests(store: BadgeDigestStore, query: BadgeDigestQuery): BadgeDigest[] {
  return query.apply(store.list());
}
