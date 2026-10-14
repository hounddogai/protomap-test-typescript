import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictJourneyRollup } from "./strict-journey-rollup.js";

/** Keeps strict journey rollups by code. */
export interface StrictJourneyRollupStore {
  find(code: string): StrictJourneyRollup | undefined;
  save(item: StrictJourneyRollup): void;
  remove(code: string): boolean;
  list(): StrictJourneyRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictJourneyRollupStore implements StrictJourneyRollupStore {
  items: Map<string, StrictJourneyRollup>;
  order: string[];

  constructor(items: Map<string, StrictJourneyRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictJourneyRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictJourneyRollup): void {
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

  list(): StrictJourneyRollup[] {
    const out: StrictJourneyRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictJourneyRollupStore(): StrictJourneyRollupStore {
  return new MemoryStrictJourneyRollupStore(new Map<string, StrictJourneyRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictJourneyRollupStore implements StrictJourneyRollupStore {
  inner: StrictJourneyRollupStore;
  cache: cache.TtlCache<StrictJourneyRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictJourneyRollupStore,
    cacheValue: cache.TtlCache<StrictJourneyRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictJourneyRollup | undefined {
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

  save(item: StrictJourneyRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictJourneyRollup[] {
    return this.inner.list();
  }
}

export function newCachedStrictJourneyRollupStore(inner: StrictJourneyRollupStore, ttl: number, clockValue: clock.Clock): StrictJourneyRollupStore {
  return new CachedStrictJourneyRollupStore(inner, cache.newTtlCache<StrictJourneyRollup>(64, ttl, clockValue), 0, 0);
}

/** Selects strict journey rollups. Empty fields match all. */
export class StrictJourneyRollupQuery {
  region: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBudget: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictJourneyRollup): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictJourneyRollup[]): StrictJourneyRollup[] {
    const matched = collections.filter(items, (candidate: StrictJourneyRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictJourneyRollups(store: StrictJourneyRollupStore, query: StrictJourneyRollupQuery): StrictJourneyRollup[] {
  return query.apply(store.list());
}
