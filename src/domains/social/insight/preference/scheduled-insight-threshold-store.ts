import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledInsightThreshold } from "./scheduled-insight-threshold.js";

/** Keeps scheduled insight thresholds by code. */
export interface ScheduledInsightThresholdStore {
  find(code: string): ScheduledInsightThreshold | undefined;
  save(item: ScheduledInsightThreshold): void;
  remove(code: string): boolean;
  list(): ScheduledInsightThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledInsightThresholdStore implements ScheduledInsightThresholdStore {
  items: Map<string, ScheduledInsightThreshold>;
  order: string[];

  constructor(items: Map<string, ScheduledInsightThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledInsightThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledInsightThreshold): void {
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

  list(): ScheduledInsightThreshold[] {
    const out: ScheduledInsightThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledInsightThresholdStore(): ScheduledInsightThresholdStore {
  return new MemoryScheduledInsightThresholdStore(new Map<string, ScheduledInsightThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledInsightThresholdStore implements ScheduledInsightThresholdStore {
  inner: ScheduledInsightThresholdStore;
  cache: cache.TtlCache<ScheduledInsightThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledInsightThresholdStore,
    cacheValue: cache.TtlCache<ScheduledInsightThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledInsightThreshold | undefined {
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

  save(item: ScheduledInsightThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledInsightThreshold[] {
    return this.inner.list();
  }
}

export function newCachedScheduledInsightThresholdStore(inner: ScheduledInsightThresholdStore, ttl: number, clockValue: clock.Clock): ScheduledInsightThresholdStore {
  return new CachedScheduledInsightThresholdStore(
    inner,
    cache.newTtlCache<ScheduledInsightThreshold>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled insight thresholds. Empty fields match all. */
export class ScheduledInsightThresholdQuery {
  name: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledInsightThreshold): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledInsightThreshold[]): ScheduledInsightThreshold[] {
    const matched = collections.filter(items, (candidate: ScheduledInsightThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledInsightThresholds(store: ScheduledInsightThresholdStore, query: ScheduledInsightThresholdQuery): ScheduledInsightThreshold[] {
  return query.apply(store.list());
}
