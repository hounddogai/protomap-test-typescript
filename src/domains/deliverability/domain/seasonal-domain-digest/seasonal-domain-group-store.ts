import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalDomainGroup } from "./seasonal-domain-group.js";

/** Keeps seasonal domain groups by code. */
export interface SeasonalDomainGroupStore {
  find(code: string): SeasonalDomainGroup | undefined;
  save(item: SeasonalDomainGroup): void;
  remove(code: string): boolean;
  list(): SeasonalDomainGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalDomainGroupStore implements SeasonalDomainGroupStore {
  items: Map<string, SeasonalDomainGroup>;
  order: string[];

  constructor(items: Map<string, SeasonalDomainGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalDomainGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalDomainGroup): void {
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

  list(): SeasonalDomainGroup[] {
    const out: SeasonalDomainGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalDomainGroupStore(): SeasonalDomainGroupStore {
  return new MemorySeasonalDomainGroupStore(new Map<string, SeasonalDomainGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalDomainGroupStore implements SeasonalDomainGroupStore {
  inner: SeasonalDomainGroupStore;
  cache: cache.TtlCache<SeasonalDomainGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalDomainGroupStore,
    cacheValue: cache.TtlCache<SeasonalDomainGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalDomainGroup | undefined {
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

  save(item: SeasonalDomainGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalDomainGroup[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalDomainGroupStore(inner: SeasonalDomainGroupStore, ttl: number, clockValue: clock.Clock): SeasonalDomainGroupStore {
  return new CachedSeasonalDomainGroupStore(inner, cache.newTtlCache<SeasonalDomainGroup>(128, ttl, clockValue), 0, 0);
}

/** Selects seasonal domain groups. Empty fields match all. */
export class SeasonalDomainGroupQuery {
  unit: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMargin: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalDomainGroup): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalDomainGroup[]): SeasonalDomainGroup[] {
    const matched = collections.filter(items, (candidate: SeasonalDomainGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalDomainGroups(store: SeasonalDomainGroupStore, query: SeasonalDomainGroupQuery): SeasonalDomainGroup[] {
  return query.apply(store.list());
}
