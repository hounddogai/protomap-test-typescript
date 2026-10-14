import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutThreshold } from "./opt-out-threshold.js";

/** Keeps opt out thresholds by code. */
export interface OptOutThresholdStore {
  find(code: string): OptOutThreshold | undefined;
  save(item: OptOutThreshold): void;
  remove(code: string): boolean;
  list(): OptOutThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutThresholdStore implements OptOutThresholdStore {
  items: Map<string, OptOutThreshold>;
  order: string[];

  constructor(items: Map<string, OptOutThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutThreshold): void {
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

  list(): OptOutThreshold[] {
    const out: OptOutThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutThresholdStore(): OptOutThresholdStore {
  return new MemoryOptOutThresholdStore(new Map<string, OptOutThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutThresholdStore implements OptOutThresholdStore {
  inner: OptOutThresholdStore;
  cache: cache.TtlCache<OptOutThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: OptOutThresholdStore,
    cacheValue: cache.TtlCache<OptOutThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutThreshold | undefined {
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

  save(item: OptOutThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutThreshold[] {
    return this.inner.list();
  }
}

export function newCachedOptOutThresholdStore(inner: OptOutThresholdStore, ttl: number, clockValue: clock.Clock): OptOutThresholdStore {
  return new CachedOptOutThresholdStore(inner, cache.newTtlCache<OptOutThreshold>(256, ttl, clockValue), 0, 0);
}

/** Selects opt out thresholds. Empty fields match all. */
export class OptOutThresholdQuery {
  channel: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minWeight: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutThreshold): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutThreshold[]): OptOutThreshold[] {
    const matched = collections.filter(items, (candidate: OptOutThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutThresholds(store: OptOutThresholdStore, query: OptOutThresholdQuery): OptOutThreshold[] {
  return query.apply(store.list());
}
