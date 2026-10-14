import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledWarmupThreshold } from "./scheduled-warmup-threshold.js";

/** Keeps scheduled warmup thresholds by code. */
export interface ScheduledWarmupThresholdStore {
  find(code: string): ScheduledWarmupThreshold | undefined;
  save(item: ScheduledWarmupThreshold): void;
  remove(code: string): boolean;
  list(): ScheduledWarmupThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledWarmupThresholdStore implements ScheduledWarmupThresholdStore {
  items: Map<string, ScheduledWarmupThreshold>;
  order: string[];

  constructor(items: Map<string, ScheduledWarmupThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledWarmupThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledWarmupThreshold): void {
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

  list(): ScheduledWarmupThreshold[] {
    const out: ScheduledWarmupThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledWarmupThresholdStore(): ScheduledWarmupThresholdStore {
  return new MemoryScheduledWarmupThresholdStore(new Map<string, ScheduledWarmupThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledWarmupThresholdStore implements ScheduledWarmupThresholdStore {
  inner: ScheduledWarmupThresholdStore;
  cache: cache.TtlCache<ScheduledWarmupThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledWarmupThresholdStore,
    cacheValue: cache.TtlCache<ScheduledWarmupThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledWarmupThreshold | undefined {
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

  save(item: ScheduledWarmupThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledWarmupThreshold[] {
    return this.inner.list();
  }
}

export function newCachedScheduledWarmupThresholdStore(inner: ScheduledWarmupThresholdStore, ttl: number, clockValue: clock.Clock): ScheduledWarmupThresholdStore {
  return new CachedScheduledWarmupThresholdStore(
    inner,
    cache.newTtlCache<ScheduledWarmupThreshold>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled warmup thresholds. Empty fields match all. */
export class ScheduledWarmupThresholdQuery {
  title: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRetries: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledWarmupThreshold): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledWarmupThreshold[]): ScheduledWarmupThreshold[] {
    const matched = collections.filter(items, (candidate: ScheduledWarmupThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledWarmupThresholds(store: ScheduledWarmupThresholdStore, query: ScheduledWarmupThresholdQuery): ScheduledWarmupThreshold[] {
  return query.apply(store.list());
}
