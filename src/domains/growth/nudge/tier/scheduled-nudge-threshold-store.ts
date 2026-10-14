import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledNudgeThreshold } from "./scheduled-nudge-threshold.js";

/** Keeps scheduled nudge thresholds by code. */
export interface ScheduledNudgeThresholdStore {
  find(code: string): ScheduledNudgeThreshold | undefined;
  save(item: ScheduledNudgeThreshold): void;
  remove(code: string): boolean;
  list(): ScheduledNudgeThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledNudgeThresholdStore implements ScheduledNudgeThresholdStore {
  items: Map<string, ScheduledNudgeThreshold>;
  order: string[];

  constructor(items: Map<string, ScheduledNudgeThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledNudgeThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledNudgeThreshold): void {
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

  list(): ScheduledNudgeThreshold[] {
    const out: ScheduledNudgeThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledNudgeThresholdStore(): ScheduledNudgeThresholdStore {
  return new MemoryScheduledNudgeThresholdStore(new Map<string, ScheduledNudgeThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledNudgeThresholdStore implements ScheduledNudgeThresholdStore {
  inner: ScheduledNudgeThresholdStore;
  cache: cache.TtlCache<ScheduledNudgeThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledNudgeThresholdStore,
    cacheValue: cache.TtlCache<ScheduledNudgeThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledNudgeThreshold | undefined {
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

  save(item: ScheduledNudgeThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledNudgeThreshold[] {
    return this.inner.list();
  }
}

export function newCachedScheduledNudgeThresholdStore(inner: ScheduledNudgeThresholdStore, ttl: number, clockValue: clock.Clock): ScheduledNudgeThresholdStore {
  return new CachedScheduledNudgeThresholdStore(
    inner,
    cache.newTtlCache<ScheduledNudgeThreshold>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled nudge thresholds. Empty fields match all. */
export class ScheduledNudgeThresholdQuery {
  title: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBid: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledNudgeThreshold): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledNudgeThreshold[]): ScheduledNudgeThreshold[] {
    const matched = collections.filter(items, (candidate: ScheduledNudgeThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledNudgeThresholds(store: ScheduledNudgeThresholdStore, query: ScheduledNudgeThresholdQuery): ScheduledNudgeThreshold[] {
  return query.apply(store.list());
}
