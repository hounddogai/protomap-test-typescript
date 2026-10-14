import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueThreshold } from "./queue-threshold.js";

/** Keeps queue thresholds by code. */
export interface QueueThresholdStore {
  find(code: string): QueueThreshold | undefined;
  save(item: QueueThreshold): void;
  remove(code: string): boolean;
  list(): QueueThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueThresholdStore implements QueueThresholdStore {
  items: Map<string, QueueThreshold>;
  order: string[];

  constructor(items: Map<string, QueueThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueThreshold): void {
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

  list(): QueueThreshold[] {
    const out: QueueThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueThresholdStore(): QueueThresholdStore {
  return new MemoryQueueThresholdStore(new Map<string, QueueThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueThresholdStore implements QueueThresholdStore {
  inner: QueueThresholdStore;
  cache: cache.TtlCache<QueueThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: QueueThresholdStore,
    cacheValue: cache.TtlCache<QueueThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueThreshold | undefined {
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

  save(item: QueueThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueThreshold[] {
    return this.inner.list();
  }
}

export function newCachedQueueThresholdStore(inner: QueueThresholdStore, ttl: number, clockValue: clock.Clock): QueueThresholdStore {
  return new CachedQueueThresholdStore(inner, cache.newTtlCache<QueueThreshold>(256, ttl, clockValue), 0, 0);
}

/** Selects queue thresholds. Empty fields match all. */
export class QueueThresholdQuery {
  country: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minThreshold: number, statuses: string[], limit: number) {
    this.country = country;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueThreshold): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueThreshold[]): QueueThreshold[] {
    const matched = collections.filter(items, (candidate: QueueThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueThresholds(store: QueueThresholdStore, query: QueueThresholdQuery): QueueThreshold[] {
  return query.apply(store.list());
}
