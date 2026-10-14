import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionThreshold } from "./retention-threshold.js";

/** Keeps retention thresholds by code. */
export interface RetentionThresholdStore {
  find(code: string): RetentionThreshold | undefined;
  save(item: RetentionThreshold): void;
  remove(code: string): boolean;
  list(): RetentionThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionThresholdStore implements RetentionThresholdStore {
  items: Map<string, RetentionThreshold>;
  order: string[];

  constructor(items: Map<string, RetentionThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionThreshold): void {
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

  list(): RetentionThreshold[] {
    const out: RetentionThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionThresholdStore(): RetentionThresholdStore {
  return new MemoryRetentionThresholdStore(new Map<string, RetentionThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionThresholdStore implements RetentionThresholdStore {
  inner: RetentionThresholdStore;
  cache: cache.TtlCache<RetentionThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionThresholdStore,
    cacheValue: cache.TtlCache<RetentionThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionThreshold | undefined {
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

  save(item: RetentionThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionThreshold[] {
    return this.inner.list();
  }
}

export function newCachedRetentionThresholdStore(inner: RetentionThresholdStore, ttl: number, clockValue: clock.Clock): RetentionThresholdStore {
  return new CachedRetentionThresholdStore(inner, cache.newTtlCache<RetentionThreshold>(64, ttl, clockValue), 0, 0);
}

/** Selects retention thresholds. Empty fields match all. */
export class RetentionThresholdQuery {
  category: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionThreshold): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionThreshold[]): RetentionThreshold[] {
    const matched = collections.filter(items, (candidate: RetentionThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionThresholds(store: RetentionThresholdStore, query: RetentionThresholdQuery): RetentionThreshold[] {
  return query.apply(store.list());
}
