import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathCheckpoint } from "./path-checkpoint.js";

/** Keeps path checkpoints by code. */
export interface PathCheckpointStore {
  find(code: string): PathCheckpoint | undefined;
  save(item: PathCheckpoint): void;
  remove(code: string): boolean;
  list(): PathCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathCheckpointStore implements PathCheckpointStore {
  items: Map<string, PathCheckpoint>;
  order: string[];

  constructor(items: Map<string, PathCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathCheckpoint): void {
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

  list(): PathCheckpoint[] {
    const out: PathCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathCheckpointStore(): PathCheckpointStore {
  return new MemoryPathCheckpointStore(new Map<string, PathCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathCheckpointStore implements PathCheckpointStore {
  inner: PathCheckpointStore;
  cache: cache.TtlCache<PathCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: PathCheckpointStore,
    cacheValue: cache.TtlCache<PathCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathCheckpoint | undefined {
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

  save(item: PathCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedPathCheckpointStore(inner: PathCheckpointStore, ttl: number, clockValue: clock.Clock): PathCheckpointStore {
  return new CachedPathCheckpointStore(inner, cache.newTtlCache<PathCheckpoint>(64, ttl, clockValue), 0, 0);
}

/** Selects path checkpoints. Empty fields match all. */
export class PathCheckpointQuery {
  country: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCapacity: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathCheckpoint): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathCheckpoint[]): PathCheckpoint[] {
    const matched = collections.filter(items, (candidate: PathCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathCheckpoints(store: PathCheckpointStore, query: PathCheckpointQuery): PathCheckpoint[] {
  return query.apply(store.list());
}
