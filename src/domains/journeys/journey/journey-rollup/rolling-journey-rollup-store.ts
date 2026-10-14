import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingJourneyRollup } from "./rolling-journey-rollup.js";

/** Keeps rolling journey rollups by code. */
export interface RollingJourneyRollupStore {
  find(code: string): RollingJourneyRollup | undefined;
  save(item: RollingJourneyRollup): void;
  remove(code: string): boolean;
  list(): RollingJourneyRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingJourneyRollupStore implements RollingJourneyRollupStore {
  items: Map<string, RollingJourneyRollup>;
  order: string[];

  constructor(items: Map<string, RollingJourneyRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingJourneyRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingJourneyRollup): void {
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

  list(): RollingJourneyRollup[] {
    const out: RollingJourneyRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingJourneyRollupStore(): RollingJourneyRollupStore {
  return new MemoryRollingJourneyRollupStore(new Map<string, RollingJourneyRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingJourneyRollupStore implements RollingJourneyRollupStore {
  inner: RollingJourneyRollupStore;
  cache: cache.TtlCache<RollingJourneyRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingJourneyRollupStore,
    cacheValue: cache.TtlCache<RollingJourneyRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingJourneyRollup | undefined {
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

  save(item: RollingJourneyRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingJourneyRollup[] {
    return this.inner.list();
  }
}

export function newCachedRollingJourneyRollupStore(inner: RollingJourneyRollupStore, ttl: number, clockValue: clock.Clock): RollingJourneyRollupStore {
  return new CachedRollingJourneyRollupStore(
    inner,
    cache.newTtlCache<RollingJourneyRollup>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling journey rollups. Empty fields match all. */
export class RollingJourneyRollupQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingJourneyRollup): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingJourneyRollup[]): RollingJourneyRollup[] {
    const matched = collections.filter(items, (candidate: RollingJourneyRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingJourneyRollups(store: RollingJourneyRollupStore, query: RollingJourneyRollupQuery): RollingJourneyRollup[] {
  return query.apply(store.list());
}
