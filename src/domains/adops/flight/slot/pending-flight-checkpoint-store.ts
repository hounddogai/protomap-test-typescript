import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingFlightCheckpoint } from "./pending-flight-checkpoint.js";

/** Keeps pending flight checkpoints by code. */
export interface PendingFlightCheckpointStore {
  find(code: string): PendingFlightCheckpoint | undefined;
  save(item: PendingFlightCheckpoint): void;
  remove(code: string): boolean;
  list(): PendingFlightCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingFlightCheckpointStore implements PendingFlightCheckpointStore {
  items: Map<string, PendingFlightCheckpoint>;
  order: string[];

  constructor(items: Map<string, PendingFlightCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingFlightCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingFlightCheckpoint): void {
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

  list(): PendingFlightCheckpoint[] {
    const out: PendingFlightCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingFlightCheckpointStore(): PendingFlightCheckpointStore {
  return new MemoryPendingFlightCheckpointStore(new Map<string, PendingFlightCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingFlightCheckpointStore implements PendingFlightCheckpointStore {
  inner: PendingFlightCheckpointStore;
  cache: cache.TtlCache<PendingFlightCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingFlightCheckpointStore,
    cacheValue: cache.TtlCache<PendingFlightCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingFlightCheckpoint | undefined {
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

  save(item: PendingFlightCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingFlightCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedPendingFlightCheckpointStore(inner: PendingFlightCheckpointStore, ttl: number, clockValue: clock.Clock): PendingFlightCheckpointStore {
  return new CachedPendingFlightCheckpointStore(
    inner,
    cache.newTtlCache<PendingFlightCheckpoint>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending flight checkpoints. Empty fields match all. */
export class PendingFlightCheckpointQuery {
  category: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRetries: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingFlightCheckpoint): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingFlightCheckpoint[]): PendingFlightCheckpoint[] {
    const matched = collections.filter(items, (candidate: PendingFlightCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingFlightCheckpoints(store: PendingFlightCheckpointStore, query: PendingFlightCheckpointQuery): PendingFlightCheckpoint[] {
  return query.apply(store.list());
}
