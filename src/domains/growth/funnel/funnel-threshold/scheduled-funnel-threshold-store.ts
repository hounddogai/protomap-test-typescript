import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFunnelThreshold } from "./scheduled-funnel-threshold.js";

/** Keeps scheduled funnel thresholds by code. */
export interface ScheduledFunnelThresholdStore {
  find(code: string): ScheduledFunnelThreshold | undefined;
  save(item: ScheduledFunnelThreshold): void;
  remove(code: string): boolean;
  list(): ScheduledFunnelThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFunnelThresholdStore implements ScheduledFunnelThresholdStore {
  items: Map<string, ScheduledFunnelThreshold>;
  order: string[];

  constructor(items: Map<string, ScheduledFunnelThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFunnelThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFunnelThreshold): void {
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

  list(): ScheduledFunnelThreshold[] {
    const out: ScheduledFunnelThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFunnelThresholdStore(): ScheduledFunnelThresholdStore {
  return new MemoryScheduledFunnelThresholdStore(new Map<string, ScheduledFunnelThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFunnelThresholdStore implements ScheduledFunnelThresholdStore {
  inner: ScheduledFunnelThresholdStore;
  cache: cache.TtlCache<ScheduledFunnelThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFunnelThresholdStore,
    cacheValue: cache.TtlCache<ScheduledFunnelThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFunnelThreshold | undefined {
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

  save(item: ScheduledFunnelThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFunnelThreshold[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFunnelThresholdStore(inner: ScheduledFunnelThresholdStore, ttl: number, clockValue: clock.Clock): ScheduledFunnelThresholdStore {
  return new CachedScheduledFunnelThresholdStore(
    inner,
    cache.newTtlCache<ScheduledFunnelThreshold>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled funnel thresholds. Empty fields match all. */
export class ScheduledFunnelThresholdQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFunnelThreshold): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFunnelThreshold[]): ScheduledFunnelThreshold[] {
    const matched = collections.filter(items, (candidate: ScheduledFunnelThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFunnelThresholds(store: ScheduledFunnelThresholdStore, query: ScheduledFunnelThresholdQuery): ScheduledFunnelThreshold[] {
  return query.apply(store.list());
}
