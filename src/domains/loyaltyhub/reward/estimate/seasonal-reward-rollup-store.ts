import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalRewardRollup } from "./seasonal-reward-rollup.js";

/** Keeps seasonal reward rollups by code. */
export interface SeasonalRewardRollupStore {
  find(code: string): SeasonalRewardRollup | undefined;
  save(item: SeasonalRewardRollup): void;
  remove(code: string): boolean;
  list(): SeasonalRewardRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalRewardRollupStore implements SeasonalRewardRollupStore {
  items: Map<string, SeasonalRewardRollup>;
  order: string[];

  constructor(items: Map<string, SeasonalRewardRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalRewardRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalRewardRollup): void {
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

  list(): SeasonalRewardRollup[] {
    const out: SeasonalRewardRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalRewardRollupStore(): SeasonalRewardRollupStore {
  return new MemorySeasonalRewardRollupStore(new Map<string, SeasonalRewardRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalRewardRollupStore implements SeasonalRewardRollupStore {
  inner: SeasonalRewardRollupStore;
  cache: cache.TtlCache<SeasonalRewardRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalRewardRollupStore,
    cacheValue: cache.TtlCache<SeasonalRewardRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalRewardRollup | undefined {
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

  save(item: SeasonalRewardRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalRewardRollup[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalRewardRollupStore(inner: SeasonalRewardRollupStore, ttl: number, clockValue: clock.Clock): SeasonalRewardRollupStore {
  return new CachedSeasonalRewardRollupStore(
    inner,
    cache.newTtlCache<SeasonalRewardRollup>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal reward rollups. Empty fields match all. */
export class SeasonalRewardRollupQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalRewardRollup): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalRewardRollup[]): SeasonalRewardRollup[] {
    const matched = collections.filter(items, (candidate: SeasonalRewardRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalRewardRollups(store: SeasonalRewardRollupStore, query: SeasonalRewardRollupQuery): SeasonalRewardRollup[] {
  return query.apply(store.list());
}
