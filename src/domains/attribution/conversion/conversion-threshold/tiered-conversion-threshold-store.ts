import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredConversionThreshold } from "./tiered-conversion-threshold.js";

/** Keeps tiered conversion thresholds by code. */
export interface TieredConversionThresholdStore {
  find(code: string): TieredConversionThreshold | undefined;
  save(item: TieredConversionThreshold): void;
  remove(code: string): boolean;
  list(): TieredConversionThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredConversionThresholdStore implements TieredConversionThresholdStore {
  items: Map<string, TieredConversionThreshold>;
  order: string[];

  constructor(items: Map<string, TieredConversionThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredConversionThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredConversionThreshold): void {
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

  list(): TieredConversionThreshold[] {
    const out: TieredConversionThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredConversionThresholdStore(): TieredConversionThresholdStore {
  return new MemoryTieredConversionThresholdStore(new Map<string, TieredConversionThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredConversionThresholdStore implements TieredConversionThresholdStore {
  inner: TieredConversionThresholdStore;
  cache: cache.TtlCache<TieredConversionThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredConversionThresholdStore,
    cacheValue: cache.TtlCache<TieredConversionThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredConversionThreshold | undefined {
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

  save(item: TieredConversionThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredConversionThreshold[] {
    return this.inner.list();
  }
}

export function newCachedTieredConversionThresholdStore(inner: TieredConversionThresholdStore, ttl: number, clockValue: clock.Clock): TieredConversionThresholdStore {
  return new CachedTieredConversionThresholdStore(
    inner,
    cache.newTtlCache<TieredConversionThreshold>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered conversion thresholds. Empty fields match all. */
export class TieredConversionThresholdQuery {
  channel: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minOpenRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredConversionThreshold): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredConversionThreshold[]): TieredConversionThreshold[] {
    const matched = collections.filter(items, (candidate: TieredConversionThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredConversionThresholds(store: TieredConversionThresholdStore, query: TieredConversionThresholdQuery): TieredConversionThreshold[] {
  return query.apply(store.list());
}
