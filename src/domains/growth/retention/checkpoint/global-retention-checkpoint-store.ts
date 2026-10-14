import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalRetentionCheckpoint } from "./global-retention-checkpoint.js";

/** Keeps global retention checkpoints by code. */
export interface GlobalRetentionCheckpointStore {
  find(code: string): GlobalRetentionCheckpoint | undefined;
  save(item: GlobalRetentionCheckpoint): void;
  remove(code: string): boolean;
  list(): GlobalRetentionCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalRetentionCheckpointStore implements GlobalRetentionCheckpointStore {
  items: Map<string, GlobalRetentionCheckpoint>;
  order: string[];

  constructor(items: Map<string, GlobalRetentionCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalRetentionCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalRetentionCheckpoint): void {
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

  list(): GlobalRetentionCheckpoint[] {
    const out: GlobalRetentionCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalRetentionCheckpointStore(): GlobalRetentionCheckpointStore {
  return new MemoryGlobalRetentionCheckpointStore(new Map<string, GlobalRetentionCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalRetentionCheckpointStore implements GlobalRetentionCheckpointStore {
  inner: GlobalRetentionCheckpointStore;
  cache: cache.TtlCache<GlobalRetentionCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalRetentionCheckpointStore,
    cacheValue: cache.TtlCache<GlobalRetentionCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalRetentionCheckpoint | undefined {
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

  save(item: GlobalRetentionCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalRetentionCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedGlobalRetentionCheckpointStore(inner: GlobalRetentionCheckpointStore, ttl: number, clockValue: clock.Clock): GlobalRetentionCheckpointStore {
  return new CachedGlobalRetentionCheckpointStore(
    inner,
    cache.newTtlCache<GlobalRetentionCheckpoint>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global retention checkpoints. Empty fields match all. */
export class GlobalRetentionCheckpointQuery {
  unit: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minVersion: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalRetentionCheckpoint): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalRetentionCheckpoint[]): GlobalRetentionCheckpoint[] {
    const matched = collections.filter(items, (candidate: GlobalRetentionCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalRetentionCheckpoints(store: GlobalRetentionCheckpointStore, query: GlobalRetentionCheckpointQuery): GlobalRetentionCheckpoint[] {
  return query.apply(store.list());
}
