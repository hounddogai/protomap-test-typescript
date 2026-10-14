import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalDeflectionCheckpoint } from "./global-deflection-checkpoint.js";

/** Keeps global deflection checkpoints by code. */
export interface GlobalDeflectionCheckpointStore {
  find(code: string): GlobalDeflectionCheckpoint | undefined;
  save(item: GlobalDeflectionCheckpoint): void;
  remove(code: string): boolean;
  list(): GlobalDeflectionCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalDeflectionCheckpointStore implements GlobalDeflectionCheckpointStore {
  items: Map<string, GlobalDeflectionCheckpoint>;
  order: string[];

  constructor(items: Map<string, GlobalDeflectionCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalDeflectionCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalDeflectionCheckpoint): void {
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

  list(): GlobalDeflectionCheckpoint[] {
    const out: GlobalDeflectionCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalDeflectionCheckpointStore(): GlobalDeflectionCheckpointStore {
  return new MemoryGlobalDeflectionCheckpointStore(new Map<string, GlobalDeflectionCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalDeflectionCheckpointStore implements GlobalDeflectionCheckpointStore {
  inner: GlobalDeflectionCheckpointStore;
  cache: cache.TtlCache<GlobalDeflectionCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalDeflectionCheckpointStore,
    cacheValue: cache.TtlCache<GlobalDeflectionCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalDeflectionCheckpoint | undefined {
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

  save(item: GlobalDeflectionCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalDeflectionCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedGlobalDeflectionCheckpointStore(inner: GlobalDeflectionCheckpointStore, ttl: number, clockValue: clock.Clock): GlobalDeflectionCheckpointStore {
  return new CachedGlobalDeflectionCheckpointStore(
    inner,
    cache.newTtlCache<GlobalDeflectionCheckpoint>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global deflection checkpoints. Empty fields match all. */
export class GlobalDeflectionCheckpointQuery {
  unit: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRetries: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalDeflectionCheckpoint): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalDeflectionCheckpoint[]): GlobalDeflectionCheckpoint[] {
    const matched = collections.filter(items, (candidate: GlobalDeflectionCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalDeflectionCheckpoints(store: GlobalDeflectionCheckpointStore, query: GlobalDeflectionCheckpointQuery): GlobalDeflectionCheckpoint[] {
  return query.apply(store.list());
}
