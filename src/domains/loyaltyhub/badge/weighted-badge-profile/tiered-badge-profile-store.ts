import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBadgeProfile } from "./tiered-badge-profile.js";

/** Keeps tiered badge profiles by code. */
export interface TieredBadgeProfileStore {
  find(code: string): TieredBadgeProfile | undefined;
  save(item: TieredBadgeProfile): void;
  remove(code: string): boolean;
  list(): TieredBadgeProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBadgeProfileStore implements TieredBadgeProfileStore {
  items: Map<string, TieredBadgeProfile>;
  order: string[];

  constructor(items: Map<string, TieredBadgeProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBadgeProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBadgeProfile): void {
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

  list(): TieredBadgeProfile[] {
    const out: TieredBadgeProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBadgeProfileStore(): TieredBadgeProfileStore {
  return new MemoryTieredBadgeProfileStore(new Map<string, TieredBadgeProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBadgeProfileStore implements TieredBadgeProfileStore {
  inner: TieredBadgeProfileStore;
  cache: cache.TtlCache<TieredBadgeProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBadgeProfileStore,
    cacheValue: cache.TtlCache<TieredBadgeProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBadgeProfile | undefined {
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

  save(item: TieredBadgeProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBadgeProfile[] {
    return this.inner.list();
  }
}

export function newCachedTieredBadgeProfileStore(inner: TieredBadgeProfileStore, ttl: number, clockValue: clock.Clock): TieredBadgeProfileStore {
  return new CachedTieredBadgeProfileStore(inner, cache.newTtlCache<TieredBadgeProfile>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered badge profiles. Empty fields match all. */
export class TieredBadgeProfileQuery {
  region: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minPriority: number, statuses: string[], limit: number) {
    this.region = region;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBadgeProfile): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBadgeProfile[]): TieredBadgeProfile[] {
    const matched = collections.filter(items, (candidate: TieredBadgeProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBadgeProfiles(store: TieredBadgeProfileStore, query: TieredBadgeProfileQuery): TieredBadgeProfile[] {
  return query.apply(store.list());
}
