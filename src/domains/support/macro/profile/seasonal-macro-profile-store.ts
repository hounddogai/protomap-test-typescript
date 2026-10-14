import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalMacroProfile } from "./seasonal-macro-profile.js";

/** Keeps seasonal macro profiles by code. */
export interface SeasonalMacroProfileStore {
  find(code: string): SeasonalMacroProfile | undefined;
  save(item: SeasonalMacroProfile): void;
  remove(code: string): boolean;
  list(): SeasonalMacroProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalMacroProfileStore implements SeasonalMacroProfileStore {
  items: Map<string, SeasonalMacroProfile>;
  order: string[];

  constructor(items: Map<string, SeasonalMacroProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalMacroProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalMacroProfile): void {
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

  list(): SeasonalMacroProfile[] {
    const out: SeasonalMacroProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalMacroProfileStore(): SeasonalMacroProfileStore {
  return new MemorySeasonalMacroProfileStore(new Map<string, SeasonalMacroProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalMacroProfileStore implements SeasonalMacroProfileStore {
  inner: SeasonalMacroProfileStore;
  cache: cache.TtlCache<SeasonalMacroProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalMacroProfileStore,
    cacheValue: cache.TtlCache<SeasonalMacroProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalMacroProfile | undefined {
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

  save(item: SeasonalMacroProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalMacroProfile[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalMacroProfileStore(inner: SeasonalMacroProfileStore, ttl: number, clockValue: clock.Clock): SeasonalMacroProfileStore {
  return new CachedSeasonalMacroProfileStore(
    inner,
    cache.newTtlCache<SeasonalMacroProfile>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal macro profiles. Empty fields match all. */
export class SeasonalMacroProfileQuery {
  unit: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalMacroProfile): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalMacroProfile[]): SeasonalMacroProfile[] {
    const matched = collections.filter(items, (candidate: SeasonalMacroProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalMacroProfiles(store: SeasonalMacroProfileStore, query: SeasonalMacroProfileQuery): SeasonalMacroProfile[] {
  return query.apply(store.list());
}
