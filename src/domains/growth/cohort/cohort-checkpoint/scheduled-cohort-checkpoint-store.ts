import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledCohortCheckpoint } from "./scheduled-cohort-checkpoint.js";

/** Keeps scheduled cohort checkpoints by code. */
export interface ScheduledCohortCheckpointStore {
  find(code: string): ScheduledCohortCheckpoint | undefined;
  save(item: ScheduledCohortCheckpoint): void;
  remove(code: string): boolean;
  list(): ScheduledCohortCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledCohortCheckpointStore implements ScheduledCohortCheckpointStore {
  items: Map<string, ScheduledCohortCheckpoint>;
  order: string[];

  constructor(items: Map<string, ScheduledCohortCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledCohortCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledCohortCheckpoint): void {
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

  list(): ScheduledCohortCheckpoint[] {
    const out: ScheduledCohortCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledCohortCheckpointStore(): ScheduledCohortCheckpointStore {
  return new MemoryScheduledCohortCheckpointStore(new Map<string, ScheduledCohortCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledCohortCheckpointStore implements ScheduledCohortCheckpointStore {
  inner: ScheduledCohortCheckpointStore;
  cache: cache.TtlCache<ScheduledCohortCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledCohortCheckpointStore,
    cacheValue: cache.TtlCache<ScheduledCohortCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledCohortCheckpoint | undefined {
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

  save(item: ScheduledCohortCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledCohortCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedScheduledCohortCheckpointStore(inner: ScheduledCohortCheckpointStore, ttl: number, clockValue: clock.Clock): ScheduledCohortCheckpointStore {
  return new CachedScheduledCohortCheckpointStore(
    inner,
    cache.newTtlCache<ScheduledCohortCheckpoint>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled cohort checkpoints. Empty fields match all. */
export class ScheduledCohortCheckpointQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledCohortCheckpoint): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledCohortCheckpoint[]): ScheduledCohortCheckpoint[] {
    const matched = collections.filter(items, (candidate: ScheduledCohortCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledCohortCheckpoints(store: ScheduledCohortCheckpointStore, query: ScheduledCohortCheckpointQuery): ScheduledCohortCheckpoint[] {
  return query.apply(store.list());
}
