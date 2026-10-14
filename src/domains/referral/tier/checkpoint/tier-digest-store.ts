import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierDigest } from "./tier-digest.js";

/** Keeps tier digests by code. */
export interface TierDigestStore {
  find(code: string): TierDigest | undefined;
  save(item: TierDigest): void;
  remove(code: string): boolean;
  list(): TierDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierDigestStore implements TierDigestStore {
  items: Map<string, TierDigest>;
  order: string[];

  constructor(items: Map<string, TierDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierDigest): void {
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

  list(): TierDigest[] {
    const out: TierDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierDigestStore(): TierDigestStore {
  return new MemoryTierDigestStore(new Map<string, TierDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierDigestStore implements TierDigestStore {
  inner: TierDigestStore;
  cache: cache.TtlCache<TierDigest>;
  hits: number;
  misses: number;

  constructor(inner: TierDigestStore, cacheValue: cache.TtlCache<TierDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierDigest | undefined {
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

  save(item: TierDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierDigest[] {
    return this.inner.list();
  }
}

export function newCachedTierDigestStore(inner: TierDigestStore, ttl: number, clockValue: clock.Clock): TierDigestStore {
  return new CachedTierDigestStore(inner, cache.newTtlCache<TierDigest>(512, ttl, clockValue), 0, 0);
}

/** Selects tier digests. Empty fields match all. */
export class TierDigestQuery {
  label: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFloorValue: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierDigest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierDigest[]): TierDigest[] {
    const matched = collections.filter(items, (candidate: TierDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierDigests(store: TierDigestStore, query: TierDigestQuery): TierDigest[] {
  return query.apply(store.list());
}
