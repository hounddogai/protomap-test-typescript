import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalChallengeAllocation } from "./seasonal-challenge-allocation.js";

/** Keeps seasonal challenge allocations by code. */
export interface SeasonalChallengeAllocationStore {
  find(code: string): SeasonalChallengeAllocation | undefined;
  save(item: SeasonalChallengeAllocation): void;
  remove(code: string): boolean;
  list(): SeasonalChallengeAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalChallengeAllocationStore implements SeasonalChallengeAllocationStore {
  items: Map<string, SeasonalChallengeAllocation>;
  order: string[];

  constructor(items: Map<string, SeasonalChallengeAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalChallengeAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalChallengeAllocation): void {
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

  list(): SeasonalChallengeAllocation[] {
    const out: SeasonalChallengeAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalChallengeAllocationStore(): SeasonalChallengeAllocationStore {
  return new MemorySeasonalChallengeAllocationStore(new Map<string, SeasonalChallengeAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalChallengeAllocationStore implements SeasonalChallengeAllocationStore {
  inner: SeasonalChallengeAllocationStore;
  cache: cache.TtlCache<SeasonalChallengeAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalChallengeAllocationStore,
    cacheValue: cache.TtlCache<SeasonalChallengeAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalChallengeAllocation | undefined {
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

  save(item: SeasonalChallengeAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalChallengeAllocation[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalChallengeAllocationStore(inner: SeasonalChallengeAllocationStore, ttl: number, clockValue: clock.Clock): SeasonalChallengeAllocationStore {
  return new CachedSeasonalChallengeAllocationStore(
    inner,
    cache.newTtlCache<SeasonalChallengeAllocation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal challenge allocations. Empty fields match all. */
export class SeasonalChallengeAllocationQuery {
  region: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.region = region;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalChallengeAllocation): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalChallengeAllocation[]): SeasonalChallengeAllocation[] {
    const matched = collections.filter(items, (candidate: SeasonalChallengeAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalChallengeAllocations(store: SeasonalChallengeAllocationStore, query: SeasonalChallengeAllocationQuery): SeasonalChallengeAllocation[] {
  return query.apply(store.list());
}
