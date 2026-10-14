import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredDomainThreshold } from "./tiered-domain-threshold.js";

/** Keeps tiered domain thresholds by code. */
export interface TieredDomainThresholdStore {
  find(code: string): TieredDomainThreshold | undefined;
  save(item: TieredDomainThreshold): void;
  remove(code: string): boolean;
  list(): TieredDomainThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredDomainThresholdStore implements TieredDomainThresholdStore {
  items: Map<string, TieredDomainThreshold>;
  order: string[];

  constructor(items: Map<string, TieredDomainThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredDomainThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredDomainThreshold): void {
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

  list(): TieredDomainThreshold[] {
    const out: TieredDomainThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredDomainThresholdStore(): TieredDomainThresholdStore {
  return new MemoryTieredDomainThresholdStore(new Map<string, TieredDomainThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredDomainThresholdStore implements TieredDomainThresholdStore {
  inner: TieredDomainThresholdStore;
  cache: cache.TtlCache<TieredDomainThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredDomainThresholdStore,
    cacheValue: cache.TtlCache<TieredDomainThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredDomainThreshold | undefined {
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

  save(item: TieredDomainThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredDomainThreshold[] {
    return this.inner.list();
  }
}

export function newCachedTieredDomainThresholdStore(inner: TieredDomainThresholdStore, ttl: number, clockValue: clock.Clock): TieredDomainThresholdStore {
  return new CachedTieredDomainThresholdStore(
    inner,
    cache.newTtlCache<TieredDomainThreshold>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered domain thresholds. Empty fields match all. */
export class TieredDomainThresholdQuery {
  channel: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAmount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredDomainThreshold): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredDomainThreshold[]): TieredDomainThreshold[] {
    const matched = collections.filter(items, (candidate: TieredDomainThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredDomainThresholds(store: TieredDomainThresholdStore, query: TieredDomainThresholdQuery): TieredDomainThreshold[] {
  return query.apply(store.list());
}
