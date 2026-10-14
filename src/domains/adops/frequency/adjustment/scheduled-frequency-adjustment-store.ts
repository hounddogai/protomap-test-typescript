import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFrequencyAdjustment } from "./scheduled-frequency-adjustment.js";

/** Keeps scheduled frequency adjustments by code. */
export interface ScheduledFrequencyAdjustmentStore {
  find(code: string): ScheduledFrequencyAdjustment | undefined;
  save(item: ScheduledFrequencyAdjustment): void;
  remove(code: string): boolean;
  list(): ScheduledFrequencyAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFrequencyAdjustmentStore implements ScheduledFrequencyAdjustmentStore {
  items: Map<string, ScheduledFrequencyAdjustment>;
  order: string[];

  constructor(items: Map<string, ScheduledFrequencyAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFrequencyAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFrequencyAdjustment): void {
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

  list(): ScheduledFrequencyAdjustment[] {
    const out: ScheduledFrequencyAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFrequencyAdjustmentStore(): ScheduledFrequencyAdjustmentStore {
  return new MemoryScheduledFrequencyAdjustmentStore(new Map<string, ScheduledFrequencyAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFrequencyAdjustmentStore implements ScheduledFrequencyAdjustmentStore {
  inner: ScheduledFrequencyAdjustmentStore;
  cache: cache.TtlCache<ScheduledFrequencyAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFrequencyAdjustmentStore,
    cacheValue: cache.TtlCache<ScheduledFrequencyAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFrequencyAdjustment | undefined {
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

  save(item: ScheduledFrequencyAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFrequencyAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFrequencyAdjustmentStore(inner: ScheduledFrequencyAdjustmentStore, ttl: number, clockValue: clock.Clock): ScheduledFrequencyAdjustmentStore {
  return new CachedScheduledFrequencyAdjustmentStore(
    inner,
    cache.newTtlCache<ScheduledFrequencyAdjustment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled frequency adjustments. Empty fields match all. */
export class ScheduledFrequencyAdjustmentQuery {
  channel: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFrequencyAdjustment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFrequencyAdjustment[]): ScheduledFrequencyAdjustment[] {
    const matched = collections.filter(items, (candidate: ScheduledFrequencyAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFrequencyAdjustments(store: ScheduledFrequencyAdjustmentStore, query: ScheduledFrequencyAdjustmentQuery): ScheduledFrequencyAdjustment[] {
  return query.apply(store.list());
}
