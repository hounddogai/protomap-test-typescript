import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalTierDigest } from "./global-tier-digest.js";

/** Keeps global tier digests by code. */
export interface GlobalTierDigestStore {
  find(code: string): GlobalTierDigest | undefined;
  save(item: GlobalTierDigest): void;
  remove(code: string): boolean;
  list(): GlobalTierDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalTierDigestStore implements GlobalTierDigestStore {
  items: Map<string, GlobalTierDigest>;
  order: string[];

  constructor(items: Map<string, GlobalTierDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalTierDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalTierDigest): void {
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

  list(): GlobalTierDigest[] {
    const out: GlobalTierDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalTierDigestStore(): GlobalTierDigestStore {
  return new MemoryGlobalTierDigestStore(new Map<string, GlobalTierDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalTierDigestStore implements GlobalTierDigestStore {
  inner: GlobalTierDigestStore;
  cache: cache.TtlCache<GlobalTierDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalTierDigestStore,
    cacheValue: cache.TtlCache<GlobalTierDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalTierDigest | undefined {
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

  save(item: GlobalTierDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalTierDigest[] {
    return this.inner.list();
  }
}

export function newCachedGlobalTierDigestStore(inner: GlobalTierDigestStore, ttl: number, clockValue: clock.Clock): GlobalTierDigestStore {
  return new CachedGlobalTierDigestStore(inner, cache.newTtlCache<GlobalTierDigest>(256, ttl, clockValue), 0, 0);
}

/** Selects global tier digests. Empty fields match all. */
export class GlobalTierDigestQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalTierDigest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalTierDigest[]): GlobalTierDigest[] {
    const matched = collections.filter(items, (candidate: GlobalTierDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalTierDigests(store: GlobalTierDigestStore, query: GlobalTierDigestQuery): GlobalTierDigest[] {
  return query.apply(store.list());
}
