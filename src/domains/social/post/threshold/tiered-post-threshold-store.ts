import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPostThreshold } from "./tiered-post-threshold.js";

/** Keeps tiered post thresholds by code. */
export interface TieredPostThresholdStore {
  find(code: string): TieredPostThreshold | undefined;
  save(item: TieredPostThreshold): void;
  remove(code: string): boolean;
  list(): TieredPostThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPostThresholdStore implements TieredPostThresholdStore {
  items: Map<string, TieredPostThreshold>;
  order: string[];

  constructor(items: Map<string, TieredPostThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPostThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPostThreshold): void {
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

  list(): TieredPostThreshold[] {
    const out: TieredPostThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPostThresholdStore(): TieredPostThresholdStore {
  return new MemoryTieredPostThresholdStore(new Map<string, TieredPostThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPostThresholdStore implements TieredPostThresholdStore {
  inner: TieredPostThresholdStore;
  cache: cache.TtlCache<TieredPostThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPostThresholdStore,
    cacheValue: cache.TtlCache<TieredPostThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPostThreshold | undefined {
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

  save(item: TieredPostThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPostThreshold[] {
    return this.inner.list();
  }
}

export function newCachedTieredPostThresholdStore(inner: TieredPostThresholdStore, ttl: number, clockValue: clock.Clock): TieredPostThresholdStore {
  return new CachedTieredPostThresholdStore(inner, cache.newTtlCache<TieredPostThreshold>(128, ttl, clockValue), 0, 0);
}

/** Selects tiered post thresholds. Empty fields match all. */
export class TieredPostThresholdQuery {
  utmSource: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minPriority: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPostThreshold): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPostThreshold[]): TieredPostThreshold[] {
    const matched = collections.filter(items, (candidate: TieredPostThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPostThresholds(store: TieredPostThresholdStore, query: TieredPostThresholdQuery): TieredPostThreshold[] {
  return query.apply(store.list());
}
