import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeProfile } from "./badge-profile.js";

/** Keeps badge profiles by code. */
export interface BadgeProfileStore {
  find(code: string): BadgeProfile | undefined;
  save(item: BadgeProfile): void;
  remove(code: string): boolean;
  list(): BadgeProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeProfileStore implements BadgeProfileStore {
  items: Map<string, BadgeProfile>;
  order: string[];

  constructor(items: Map<string, BadgeProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeProfile): void {
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

  list(): BadgeProfile[] {
    const out: BadgeProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeProfileStore(): BadgeProfileStore {
  return new MemoryBadgeProfileStore(new Map<string, BadgeProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeProfileStore implements BadgeProfileStore {
  inner: BadgeProfileStore;
  cache: cache.TtlCache<BadgeProfile>;
  hits: number;
  misses: number;

  constructor(inner: BadgeProfileStore, cacheValue: cache.TtlCache<BadgeProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeProfile | undefined {
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

  save(item: BadgeProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeProfile[] {
    return this.inner.list();
  }
}

export function newCachedBadgeProfileStore(inner: BadgeProfileStore, ttl: number, clockValue: clock.Clock): BadgeProfileStore {
  return new CachedBadgeProfileStore(inner, cache.newTtlCache<BadgeProfile>(256, ttl, clockValue), 0, 0);
}

/** Selects badge profiles. Empty fields match all. */
export class BadgeProfileQuery {
  region: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.region = region;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeProfile): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeProfile[]): BadgeProfile[] {
    const matched = collections.filter(items, (candidate: BadgeProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeProfiles(store: BadgeProfileStore, query: BadgeProfileQuery): BadgeProfile[] {
  return query.apply(store.list());
}
