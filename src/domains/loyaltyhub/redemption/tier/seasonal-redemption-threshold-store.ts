import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalRedemptionThreshold } from "./seasonal-redemption-threshold.js";

/** Keeps seasonal redemption thresholds by code. */
export interface SeasonalRedemptionThresholdStore {
  find(code: string): SeasonalRedemptionThreshold | undefined;
  save(item: SeasonalRedemptionThreshold): void;
  remove(code: string): boolean;
  list(): SeasonalRedemptionThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalRedemptionThresholdStore implements SeasonalRedemptionThresholdStore {
  items: Map<string, SeasonalRedemptionThreshold>;
  order: string[];

  constructor(items: Map<string, SeasonalRedemptionThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalRedemptionThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalRedemptionThreshold): void {
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

  list(): SeasonalRedemptionThreshold[] {
    const out: SeasonalRedemptionThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalRedemptionThresholdStore(): SeasonalRedemptionThresholdStore {
  return new MemorySeasonalRedemptionThresholdStore(new Map<string, SeasonalRedemptionThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalRedemptionThresholdStore implements SeasonalRedemptionThresholdStore {
  inner: SeasonalRedemptionThresholdStore;
  cache: cache.TtlCache<SeasonalRedemptionThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalRedemptionThresholdStore,
    cacheValue: cache.TtlCache<SeasonalRedemptionThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalRedemptionThreshold | undefined {
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

  save(item: SeasonalRedemptionThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalRedemptionThreshold[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalRedemptionThresholdStore(inner: SeasonalRedemptionThresholdStore, ttl: number, clockValue: clock.Clock): SeasonalRedemptionThresholdStore {
  return new CachedSeasonalRedemptionThresholdStore(
    inner,
    cache.newTtlCache<SeasonalRedemptionThreshold>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal redemption thresholds. Empty fields match all. */
export class SeasonalRedemptionThresholdQuery {
  utmSource: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minFloorValue: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalRedemptionThreshold): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalRedemptionThreshold[]): SeasonalRedemptionThreshold[] {
    const matched = collections.filter(items, (candidate: SeasonalRedemptionThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalRedemptionThresholds(store: SeasonalRedemptionThresholdStore, query: SeasonalRedemptionThresholdQuery): SeasonalRedemptionThreshold[] {
  return query.apply(store.list());
}
