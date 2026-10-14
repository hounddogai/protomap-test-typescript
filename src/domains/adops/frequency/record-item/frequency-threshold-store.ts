import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyThreshold } from "./frequency-threshold.js";

/** Keeps frequency thresholds by code. */
export interface FrequencyThresholdStore {
  find(code: string): FrequencyThreshold | undefined;
  save(item: FrequencyThreshold): void;
  remove(code: string): boolean;
  list(): FrequencyThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyThresholdStore implements FrequencyThresholdStore {
  items: Map<string, FrequencyThreshold>;
  order: string[];

  constructor(items: Map<string, FrequencyThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyThreshold): void {
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

  list(): FrequencyThreshold[] {
    const out: FrequencyThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyThresholdStore(): FrequencyThresholdStore {
  return new MemoryFrequencyThresholdStore(new Map<string, FrequencyThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyThresholdStore implements FrequencyThresholdStore {
  inner: FrequencyThresholdStore;
  cache: cache.TtlCache<FrequencyThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyThresholdStore,
    cacheValue: cache.TtlCache<FrequencyThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyThreshold | undefined {
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

  save(item: FrequencyThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyThreshold[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyThresholdStore(inner: FrequencyThresholdStore, ttl: number, clockValue: clock.Clock): FrequencyThresholdStore {
  return new CachedFrequencyThresholdStore(inner, cache.newTtlCache<FrequencyThreshold>(512, ttl, clockValue), 0, 0);
}

/** Selects frequency thresholds. Empty fields match all. */
export class FrequencyThresholdQuery {
  source: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyThreshold): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyThreshold[]): FrequencyThreshold[] {
    const matched = collections.filter(items, (candidate: FrequencyThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyThresholds(store: FrequencyThresholdStore, query: FrequencyThresholdQuery): FrequencyThreshold[] {
  return query.apply(store.list());
}
