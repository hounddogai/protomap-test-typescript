import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalEnrollmentThreshold } from "./seasonal-enrollment-threshold.js";

/** Keeps seasonal enrollment thresholds by code. */
export interface SeasonalEnrollmentThresholdStore {
  find(code: string): SeasonalEnrollmentThreshold | undefined;
  save(item: SeasonalEnrollmentThreshold): void;
  remove(code: string): boolean;
  list(): SeasonalEnrollmentThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalEnrollmentThresholdStore implements SeasonalEnrollmentThresholdStore {
  items: Map<string, SeasonalEnrollmentThreshold>;
  order: string[];

  constructor(items: Map<string, SeasonalEnrollmentThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalEnrollmentThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalEnrollmentThreshold): void {
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

  list(): SeasonalEnrollmentThreshold[] {
    const out: SeasonalEnrollmentThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalEnrollmentThresholdStore(): SeasonalEnrollmentThresholdStore {
  return new MemorySeasonalEnrollmentThresholdStore(new Map<string, SeasonalEnrollmentThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalEnrollmentThresholdStore implements SeasonalEnrollmentThresholdStore {
  inner: SeasonalEnrollmentThresholdStore;
  cache: cache.TtlCache<SeasonalEnrollmentThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalEnrollmentThresholdStore,
    cacheValue: cache.TtlCache<SeasonalEnrollmentThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalEnrollmentThreshold | undefined {
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

  save(item: SeasonalEnrollmentThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalEnrollmentThreshold[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalEnrollmentThresholdStore(inner: SeasonalEnrollmentThresholdStore, ttl: number, clockValue: clock.Clock): SeasonalEnrollmentThresholdStore {
  return new CachedSeasonalEnrollmentThresholdStore(
    inner,
    cache.newTtlCache<SeasonalEnrollmentThreshold>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal enrollment thresholds. Empty fields match all. */
export class SeasonalEnrollmentThresholdQuery {
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

  matches(item: SeasonalEnrollmentThreshold): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalEnrollmentThreshold[]): SeasonalEnrollmentThreshold[] {
    const matched = collections.filter(items, (candidate: SeasonalEnrollmentThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalEnrollmentThresholds(store: SeasonalEnrollmentThresholdStore, query: SeasonalEnrollmentThresholdQuery): SeasonalEnrollmentThreshold[] {
  return query.apply(store.list());
}
