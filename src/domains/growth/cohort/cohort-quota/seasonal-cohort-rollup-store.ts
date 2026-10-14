import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalCohortRollup } from "./seasonal-cohort-rollup.js";

/** Keeps seasonal cohort rollups by code. */
export interface SeasonalCohortRollupStore {
  find(code: string): SeasonalCohortRollup | undefined;
  save(item: SeasonalCohortRollup): void;
  remove(code: string): boolean;
  list(): SeasonalCohortRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalCohortRollupStore implements SeasonalCohortRollupStore {
  items: Map<string, SeasonalCohortRollup>;
  order: string[];

  constructor(items: Map<string, SeasonalCohortRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalCohortRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalCohortRollup): void {
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

  list(): SeasonalCohortRollup[] {
    const out: SeasonalCohortRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalCohortRollupStore(): SeasonalCohortRollupStore {
  return new MemorySeasonalCohortRollupStore(new Map<string, SeasonalCohortRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalCohortRollupStore implements SeasonalCohortRollupStore {
  inner: SeasonalCohortRollupStore;
  cache: cache.TtlCache<SeasonalCohortRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalCohortRollupStore,
    cacheValue: cache.TtlCache<SeasonalCohortRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalCohortRollup | undefined {
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

  save(item: SeasonalCohortRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalCohortRollup[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalCohortRollupStore(inner: SeasonalCohortRollupStore, ttl: number, clockValue: clock.Clock): SeasonalCohortRollupStore {
  return new CachedSeasonalCohortRollupStore(
    inner,
    cache.newTtlCache<SeasonalCohortRollup>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal cohort rollups. Empty fields match all. */
export class SeasonalCohortRollupQuery {
  channel: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalCohortRollup): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalCohortRollup[]): SeasonalCohortRollup[] {
    const matched = collections.filter(items, (candidate: SeasonalCohortRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalCohortRollups(store: SeasonalCohortRollupStore, query: SeasonalCohortRollupQuery): SeasonalCohortRollup[] {
  return query.apply(store.list());
}
