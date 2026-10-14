import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveSlaThreshold } from "./adaptive-sla-threshold.js";

/** Keeps adaptive sla thresholds by code. */
export interface AdaptiveSlaThresholdStore {
  find(code: string): AdaptiveSlaThreshold | undefined;
  save(item: AdaptiveSlaThreshold): void;
  remove(code: string): boolean;
  list(): AdaptiveSlaThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveSlaThresholdStore implements AdaptiveSlaThresholdStore {
  items: Map<string, AdaptiveSlaThreshold>;
  order: string[];

  constructor(items: Map<string, AdaptiveSlaThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveSlaThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveSlaThreshold): void {
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

  list(): AdaptiveSlaThreshold[] {
    const out: AdaptiveSlaThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveSlaThresholdStore(): AdaptiveSlaThresholdStore {
  return new MemoryAdaptiveSlaThresholdStore(new Map<string, AdaptiveSlaThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveSlaThresholdStore implements AdaptiveSlaThresholdStore {
  inner: AdaptiveSlaThresholdStore;
  cache: cache.TtlCache<AdaptiveSlaThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveSlaThresholdStore,
    cacheValue: cache.TtlCache<AdaptiveSlaThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveSlaThreshold | undefined {
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

  save(item: AdaptiveSlaThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveSlaThreshold[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveSlaThresholdStore(inner: AdaptiveSlaThresholdStore, ttl: number, clockValue: clock.Clock): AdaptiveSlaThresholdStore {
  return new CachedAdaptiveSlaThresholdStore(
    inner,
    cache.newTtlCache<AdaptiveSlaThreshold>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive sla thresholds. Empty fields match all. */
export class AdaptiveSlaThresholdQuery {
  name: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMinimum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveSlaThreshold): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveSlaThreshold[]): AdaptiveSlaThreshold[] {
    const matched = collections.filter(items, (candidate: AdaptiveSlaThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveSlaThresholds(store: AdaptiveSlaThresholdStore, query: AdaptiveSlaThresholdQuery): AdaptiveSlaThreshold[] {
  return query.apply(store.list());
}
