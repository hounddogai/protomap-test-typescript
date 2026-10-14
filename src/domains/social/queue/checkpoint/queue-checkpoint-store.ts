import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueCheckpoint } from "./queue-checkpoint.js";

/** Keeps queue checkpoints by code. */
export interface QueueCheckpointStore {
  find(code: string): QueueCheckpoint | undefined;
  save(item: QueueCheckpoint): void;
  remove(code: string): boolean;
  list(): QueueCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueCheckpointStore implements QueueCheckpointStore {
  items: Map<string, QueueCheckpoint>;
  order: string[];

  constructor(items: Map<string, QueueCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueCheckpoint): void {
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

  list(): QueueCheckpoint[] {
    const out: QueueCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueCheckpointStore(): QueueCheckpointStore {
  return new MemoryQueueCheckpointStore(new Map<string, QueueCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueCheckpointStore implements QueueCheckpointStore {
  inner: QueueCheckpointStore;
  cache: cache.TtlCache<QueueCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: QueueCheckpointStore,
    cacheValue: cache.TtlCache<QueueCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueCheckpoint | undefined {
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

  save(item: QueueCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedQueueCheckpointStore(inner: QueueCheckpointStore, ttl: number, clockValue: clock.Clock): QueueCheckpointStore {
  return new CachedQueueCheckpointStore(inner, cache.newTtlCache<QueueCheckpoint>(1024, ttl, clockValue), 0, 0);
}

/** Selects queue checkpoints. Empty fields match all. */
export class QueueCheckpointQuery {
  region: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMinimum: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueCheckpoint): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueCheckpoint[]): QueueCheckpoint[] {
    const matched = collections.filter(items, (candidate: QueueCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueCheckpoints(store: QueueCheckpointStore, query: QueueCheckpointQuery): QueueCheckpoint[] {
  return query.apply(store.list());
}
