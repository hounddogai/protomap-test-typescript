import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredInviteProfile } from "./tiered-invite-profile.js";

/** Keeps tiered invite profiles by code. */
export interface TieredInviteProfileStore {
  find(code: string): TieredInviteProfile | undefined;
  save(item: TieredInviteProfile): void;
  remove(code: string): boolean;
  list(): TieredInviteProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredInviteProfileStore implements TieredInviteProfileStore {
  items: Map<string, TieredInviteProfile>;
  order: string[];

  constructor(items: Map<string, TieredInviteProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredInviteProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredInviteProfile): void {
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

  list(): TieredInviteProfile[] {
    const out: TieredInviteProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredInviteProfileStore(): TieredInviteProfileStore {
  return new MemoryTieredInviteProfileStore(new Map<string, TieredInviteProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredInviteProfileStore implements TieredInviteProfileStore {
  inner: TieredInviteProfileStore;
  cache: cache.TtlCache<TieredInviteProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredInviteProfileStore,
    cacheValue: cache.TtlCache<TieredInviteProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredInviteProfile | undefined {
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

  save(item: TieredInviteProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredInviteProfile[] {
    return this.inner.list();
  }
}

export function newCachedTieredInviteProfileStore(inner: TieredInviteProfileStore, ttl: number, clockValue: clock.Clock): TieredInviteProfileStore {
  return new CachedTieredInviteProfileStore(inner, cache.newTtlCache<TieredInviteProfile>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered invite profiles. Empty fields match all. */
export class TieredInviteProfileQuery {
  country: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCapacity: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredInviteProfile): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredInviteProfile[]): TieredInviteProfile[] {
    const matched = collections.filter(items, (candidate: TieredInviteProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredInviteProfiles(store: TieredInviteProfileStore, query: TieredInviteProfileQuery): TieredInviteProfile[] {
  return query.apply(store.list());
}
