import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingReputationCheckpoint } from "./pending-reputation-checkpoint.js";

/** Keeps pending reputation checkpoints by code. */
export interface PendingReputationCheckpointStore {
  find(code: string): PendingReputationCheckpoint | undefined;
  save(item: PendingReputationCheckpoint): void;
  remove(code: string): boolean;
  list(): PendingReputationCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingReputationCheckpointStore implements PendingReputationCheckpointStore {
  items: Map<string, PendingReputationCheckpoint>;
  order: string[];

  constructor(items: Map<string, PendingReputationCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingReputationCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingReputationCheckpoint): void {
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

  list(): PendingReputationCheckpoint[] {
    const out: PendingReputationCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingReputationCheckpointStore(): PendingReputationCheckpointStore {
  return new MemoryPendingReputationCheckpointStore(new Map<string, PendingReputationCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingReputationCheckpointStore implements PendingReputationCheckpointStore {
  inner: PendingReputationCheckpointStore;
  cache: cache.TtlCache<PendingReputationCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingReputationCheckpointStore,
    cacheValue: cache.TtlCache<PendingReputationCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingReputationCheckpoint | undefined {
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

  save(item: PendingReputationCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingReputationCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedPendingReputationCheckpointStore(inner: PendingReputationCheckpointStore, ttl: number, clockValue: clock.Clock): PendingReputationCheckpointStore {
  return new CachedPendingReputationCheckpointStore(
    inner,
    cache.newTtlCache<PendingReputationCheckpoint>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending reputation checkpoints. Empty fields match all. */
export class PendingReputationCheckpointQuery {
  utmSource: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingReputationCheckpoint): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingReputationCheckpoint[]): PendingReputationCheckpoint[] {
    const matched = collections.filter(items, (candidate: PendingReputationCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingReputationCheckpoints(store: PendingReputationCheckpointStore, query: PendingReputationCheckpointQuery): PendingReputationCheckpoint[] {
  return query.apply(store.list());
}
