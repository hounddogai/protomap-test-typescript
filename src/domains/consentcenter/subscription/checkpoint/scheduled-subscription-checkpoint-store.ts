import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledSubscriptionCheckpoint } from "./scheduled-subscription-checkpoint.js";

/** Keeps scheduled subscription checkpoints by code. */
export interface ScheduledSubscriptionCheckpointStore {
  find(code: string): ScheduledSubscriptionCheckpoint | undefined;
  save(item: ScheduledSubscriptionCheckpoint): void;
  remove(code: string): boolean;
  list(): ScheduledSubscriptionCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledSubscriptionCheckpointStore implements ScheduledSubscriptionCheckpointStore {
  items: Map<string, ScheduledSubscriptionCheckpoint>;
  order: string[];

  constructor(items: Map<string, ScheduledSubscriptionCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledSubscriptionCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledSubscriptionCheckpoint): void {
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

  list(): ScheduledSubscriptionCheckpoint[] {
    const out: ScheduledSubscriptionCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledSubscriptionCheckpointStore(): ScheduledSubscriptionCheckpointStore {
  return new MemoryScheduledSubscriptionCheckpointStore(new Map<string, ScheduledSubscriptionCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledSubscriptionCheckpointStore implements ScheduledSubscriptionCheckpointStore {
  inner: ScheduledSubscriptionCheckpointStore;
  cache: cache.TtlCache<ScheduledSubscriptionCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledSubscriptionCheckpointStore,
    cacheValue: cache.TtlCache<ScheduledSubscriptionCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledSubscriptionCheckpoint | undefined {
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

  save(item: ScheduledSubscriptionCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledSubscriptionCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedScheduledSubscriptionCheckpointStore(inner: ScheduledSubscriptionCheckpointStore, ttl: number, clockValue: clock.Clock): ScheduledSubscriptionCheckpointStore {
  return new CachedScheduledSubscriptionCheckpointStore(
    inner,
    cache.newTtlCache<ScheduledSubscriptionCheckpoint>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled subscription checkpoints. Empty fields match all. */
export class ScheduledSubscriptionCheckpointQuery {
  label: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledSubscriptionCheckpoint): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledSubscriptionCheckpoint[]): ScheduledSubscriptionCheckpoint[] {
    const matched = collections.filter(items, (candidate: ScheduledSubscriptionCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledSubscriptionCheckpoints(store: ScheduledSubscriptionCheckpointStore, query: ScheduledSubscriptionCheckpointQuery): ScheduledSubscriptionCheckpoint[] {
  return query.apply(store.list());
}
