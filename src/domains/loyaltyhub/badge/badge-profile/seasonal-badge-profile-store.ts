import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalBadgeProfile } from "./seasonal-badge-profile.js";

/** Keeps seasonal badge profiles by code. */
export interface SeasonalBadgeProfileStore {
  find(code: string): SeasonalBadgeProfile | undefined;
  save(item: SeasonalBadgeProfile): void;
  remove(code: string): boolean;
  list(): SeasonalBadgeProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalBadgeProfileStore implements SeasonalBadgeProfileStore {
  items: Map<string, SeasonalBadgeProfile>;
  order: string[];

  constructor(items: Map<string, SeasonalBadgeProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalBadgeProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalBadgeProfile): void {
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

  list(): SeasonalBadgeProfile[] {
    const out: SeasonalBadgeProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalBadgeProfileStore(): SeasonalBadgeProfileStore {
  return new MemorySeasonalBadgeProfileStore(new Map<string, SeasonalBadgeProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalBadgeProfileStore implements SeasonalBadgeProfileStore {
  inner: SeasonalBadgeProfileStore;
  cache: cache.TtlCache<SeasonalBadgeProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalBadgeProfileStore,
    cacheValue: cache.TtlCache<SeasonalBadgeProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalBadgeProfile | undefined {
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

  save(item: SeasonalBadgeProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalBadgeProfile[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalBadgeProfileStore(inner: SeasonalBadgeProfileStore, ttl: number, clockValue: clock.Clock): SeasonalBadgeProfileStore {
  return new CachedSeasonalBadgeProfileStore(
    inner,
    cache.newTtlCache<SeasonalBadgeProfile>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal badge profiles. Empty fields match all. */
export class SeasonalBadgeProfileQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalBadgeProfile): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalBadgeProfile[]): SeasonalBadgeProfile[] {
    const matched = collections.filter(items, (candidate: SeasonalBadgeProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalBadgeProfiles(store: SeasonalBadgeProfileStore, query: SeasonalBadgeProfileQuery): SeasonalBadgeProfile[] {
  return query.apply(store.list());
}
