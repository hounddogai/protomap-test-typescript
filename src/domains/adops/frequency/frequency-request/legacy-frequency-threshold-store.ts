import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyFrequencyThreshold } from "./legacy-frequency-threshold.js";

/** Keeps legacy frequency thresholds by code. */
export interface LegacyFrequencyThresholdStore {
  find(code: string): LegacyFrequencyThreshold | undefined;
  save(item: LegacyFrequencyThreshold): void;
  remove(code: string): boolean;
  list(): LegacyFrequencyThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyFrequencyThresholdStore implements LegacyFrequencyThresholdStore {
  items: Map<string, LegacyFrequencyThreshold>;
  order: string[];

  constructor(items: Map<string, LegacyFrequencyThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyFrequencyThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyFrequencyThreshold): void {
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

  list(): LegacyFrequencyThreshold[] {
    const out: LegacyFrequencyThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyFrequencyThresholdStore(): LegacyFrequencyThresholdStore {
  return new MemoryLegacyFrequencyThresholdStore(new Map<string, LegacyFrequencyThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyFrequencyThresholdStore implements LegacyFrequencyThresholdStore {
  inner: LegacyFrequencyThresholdStore;
  cache: cache.TtlCache<LegacyFrequencyThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyFrequencyThresholdStore,
    cacheValue: cache.TtlCache<LegacyFrequencyThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyFrequencyThreshold | undefined {
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

  save(item: LegacyFrequencyThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyFrequencyThreshold[] {
    return this.inner.list();
  }
}

export function newCachedLegacyFrequencyThresholdStore(inner: LegacyFrequencyThresholdStore, ttl: number, clockValue: clock.Clock): LegacyFrequencyThresholdStore {
  return new CachedLegacyFrequencyThresholdStore(
    inner,
    cache.newTtlCache<LegacyFrequencyThreshold>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy frequency thresholds. Empty fields match all. */
export class LegacyFrequencyThresholdQuery {
  channel: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minClicks: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyFrequencyThreshold): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyFrequencyThreshold[]): LegacyFrequencyThreshold[] {
    const matched = collections.filter(items, (candidate: LegacyFrequencyThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyFrequencyThresholds(store: LegacyFrequencyThresholdStore, query: LegacyFrequencyThresholdQuery): LegacyFrequencyThreshold[] {
  return query.apply(store.list());
}
