import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledDeflectionCheckpoint } from "./scheduled-deflection-checkpoint.js";

/** Keeps scheduled deflection checkpoints by code. */
export interface ScheduledDeflectionCheckpointStore {
  find(code: string): ScheduledDeflectionCheckpoint | undefined;
  save(item: ScheduledDeflectionCheckpoint): void;
  remove(code: string): boolean;
  list(): ScheduledDeflectionCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledDeflectionCheckpointStore implements ScheduledDeflectionCheckpointStore {
  items: Map<string, ScheduledDeflectionCheckpoint>;
  order: string[];

  constructor(items: Map<string, ScheduledDeflectionCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledDeflectionCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledDeflectionCheckpoint): void {
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

  list(): ScheduledDeflectionCheckpoint[] {
    const out: ScheduledDeflectionCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledDeflectionCheckpointStore(): ScheduledDeflectionCheckpointStore {
  return new MemoryScheduledDeflectionCheckpointStore(new Map<string, ScheduledDeflectionCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledDeflectionCheckpointStore implements ScheduledDeflectionCheckpointStore {
  inner: ScheduledDeflectionCheckpointStore;
  cache: cache.TtlCache<ScheduledDeflectionCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledDeflectionCheckpointStore,
    cacheValue: cache.TtlCache<ScheduledDeflectionCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledDeflectionCheckpoint | undefined {
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

  save(item: ScheduledDeflectionCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledDeflectionCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedScheduledDeflectionCheckpointStore(inner: ScheduledDeflectionCheckpointStore, ttl: number, clockValue: clock.Clock): ScheduledDeflectionCheckpointStore {
  return new CachedScheduledDeflectionCheckpointStore(
    inner,
    cache.newTtlCache<ScheduledDeflectionCheckpoint>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled deflection checkpoints. Empty fields match all. */
export class ScheduledDeflectionCheckpointQuery {
  unit: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRate: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledDeflectionCheckpoint): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledDeflectionCheckpoint[]): ScheduledDeflectionCheckpoint[] {
    const matched = collections.filter(items, (candidate: ScheduledDeflectionCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledDeflectionCheckpoints(store: ScheduledDeflectionCheckpointStore, query: ScheduledDeflectionCheckpointQuery): ScheduledDeflectionCheckpoint[] {
  return query.apply(store.list());
}
