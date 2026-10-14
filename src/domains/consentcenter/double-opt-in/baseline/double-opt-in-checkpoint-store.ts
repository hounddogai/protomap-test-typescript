import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInCheckpoint } from "./double-opt-in-checkpoint.js";

/** Keeps double opt in checkpoints by code. */
export interface DoubleOptInCheckpointStore {
  find(code: string): DoubleOptInCheckpoint | undefined;
  save(item: DoubleOptInCheckpoint): void;
  remove(code: string): boolean;
  list(): DoubleOptInCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInCheckpointStore implements DoubleOptInCheckpointStore {
  items: Map<string, DoubleOptInCheckpoint>;
  order: string[];

  constructor(items: Map<string, DoubleOptInCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInCheckpoint): void {
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

  list(): DoubleOptInCheckpoint[] {
    const out: DoubleOptInCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInCheckpointStore(): DoubleOptInCheckpointStore {
  return new MemoryDoubleOptInCheckpointStore(new Map<string, DoubleOptInCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInCheckpointStore implements DoubleOptInCheckpointStore {
  inner: DoubleOptInCheckpointStore;
  cache: cache.TtlCache<DoubleOptInCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInCheckpointStore,
    cacheValue: cache.TtlCache<DoubleOptInCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInCheckpoint | undefined {
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

  save(item: DoubleOptInCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInCheckpointStore(inner: DoubleOptInCheckpointStore, ttl: number, clockValue: clock.Clock): DoubleOptInCheckpointStore {
  return new CachedDoubleOptInCheckpointStore(
    inner,
    cache.newTtlCache<DoubleOptInCheckpoint>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects double opt in checkpoints. Empty fields match all. */
export class DoubleOptInCheckpointQuery {
  segment: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minVersion: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInCheckpoint): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInCheckpoint[]): DoubleOptInCheckpoint[] {
    const matched = collections.filter(items, (candidate: DoubleOptInCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInCheckpoints(store: DoubleOptInCheckpointStore, query: DoubleOptInCheckpointQuery): DoubleOptInCheckpoint[] {
  return query.apply(store.list());
}
