import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientQueueThreshold } from "./lenient-queue-threshold.js";

/** Keeps lenient queue thresholds by code. */
export interface LenientQueueThresholdStore {
  find(code: string): LenientQueueThreshold | undefined;
  save(item: LenientQueueThreshold): void;
  remove(code: string): boolean;
  list(): LenientQueueThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientQueueThresholdStore implements LenientQueueThresholdStore {
  items: Map<string, LenientQueueThreshold>;
  order: string[];

  constructor(items: Map<string, LenientQueueThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientQueueThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientQueueThreshold): void {
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

  list(): LenientQueueThreshold[] {
    const out: LenientQueueThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientQueueThresholdStore(): LenientQueueThresholdStore {
  return new MemoryLenientQueueThresholdStore(new Map<string, LenientQueueThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientQueueThresholdStore implements LenientQueueThresholdStore {
  inner: LenientQueueThresholdStore;
  cache: cache.TtlCache<LenientQueueThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientQueueThresholdStore,
    cacheValue: cache.TtlCache<LenientQueueThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientQueueThreshold | undefined {
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

  save(item: LenientQueueThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientQueueThreshold[] {
    return this.inner.list();
  }
}

export function newCachedLenientQueueThresholdStore(inner: LenientQueueThresholdStore, ttl: number, clockValue: clock.Clock): LenientQueueThresholdStore {
  return new CachedLenientQueueThresholdStore(
    inner,
    cache.newTtlCache<LenientQueueThreshold>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient queue thresholds. Empty fields match all. */
export class LenientQueueThresholdQuery {
  locale: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientQueueThreshold): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientQueueThreshold[]): LenientQueueThreshold[] {
    const matched = collections.filter(items, (candidate: LenientQueueThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientQueueThresholds(store: LenientQueueThresholdStore, query: LenientQueueThresholdQuery): LenientQueueThreshold[] {
  return query.apply(store.list());
}
