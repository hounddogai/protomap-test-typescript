import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredActivationDigest } from "./tiered-activation-digest.js";

/** Keeps tiered activation digests by code. */
export interface TieredActivationDigestStore {
  find(code: string): TieredActivationDigest | undefined;
  save(item: TieredActivationDigest): void;
  remove(code: string): boolean;
  list(): TieredActivationDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredActivationDigestStore implements TieredActivationDigestStore {
  items: Map<string, TieredActivationDigest>;
  order: string[];

  constructor(items: Map<string, TieredActivationDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredActivationDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredActivationDigest): void {
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

  list(): TieredActivationDigest[] {
    const out: TieredActivationDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredActivationDigestStore(): TieredActivationDigestStore {
  return new MemoryTieredActivationDigestStore(new Map<string, TieredActivationDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredActivationDigestStore implements TieredActivationDigestStore {
  inner: TieredActivationDigestStore;
  cache: cache.TtlCache<TieredActivationDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredActivationDigestStore,
    cacheValue: cache.TtlCache<TieredActivationDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredActivationDigest | undefined {
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

  save(item: TieredActivationDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredActivationDigest[] {
    return this.inner.list();
  }
}

export function newCachedTieredActivationDigestStore(inner: TieredActivationDigestStore, ttl: number, clockValue: clock.Clock): TieredActivationDigestStore {
  return new CachedTieredActivationDigestStore(
    inner,
    cache.newTtlCache<TieredActivationDigest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered activation digests. Empty fields match all. */
export class TieredActivationDigestQuery {
  locale: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFloorValue: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredActivationDigest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredActivationDigest[]): TieredActivationDigest[] {
    const matched = collections.filter(items, (candidate: TieredActivationDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredActivationDigests(store: TieredActivationDigestStore, query: TieredActivationDigestQuery): TieredActivationDigest[] {
  return query.apply(store.list());
}
