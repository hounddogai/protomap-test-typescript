import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPacingThreshold } from "./legacy-pacing-threshold.js";

/** Keeps legacy pacing thresholds by code. */
export interface LegacyPacingThresholdStore {
  find(code: string): LegacyPacingThreshold | undefined;
  save(item: LegacyPacingThreshold): void;
  remove(code: string): boolean;
  list(): LegacyPacingThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPacingThresholdStore implements LegacyPacingThresholdStore {
  items: Map<string, LegacyPacingThreshold>;
  order: string[];

  constructor(items: Map<string, LegacyPacingThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPacingThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPacingThreshold): void {
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

  list(): LegacyPacingThreshold[] {
    const out: LegacyPacingThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPacingThresholdStore(): LegacyPacingThresholdStore {
  return new MemoryLegacyPacingThresholdStore(new Map<string, LegacyPacingThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPacingThresholdStore implements LegacyPacingThresholdStore {
  inner: LegacyPacingThresholdStore;
  cache: cache.TtlCache<LegacyPacingThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPacingThresholdStore,
    cacheValue: cache.TtlCache<LegacyPacingThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPacingThreshold | undefined {
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

  save(item: LegacyPacingThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPacingThreshold[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPacingThresholdStore(inner: LegacyPacingThresholdStore, ttl: number, clockValue: clock.Clock): LegacyPacingThresholdStore {
  return new CachedLegacyPacingThresholdStore(
    inner,
    cache.newTtlCache<LegacyPacingThreshold>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy pacing thresholds. Empty fields match all. */
export class LegacyPacingThresholdQuery {
  region: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPacingThreshold): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPacingThreshold[]): LegacyPacingThreshold[] {
    const matched = collections.filter(items, (candidate: LegacyPacingThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPacingThresholds(store: LegacyPacingThresholdStore, query: LegacyPacingThresholdQuery): LegacyPacingThreshold[] {
  return query.apply(store.list());
}
