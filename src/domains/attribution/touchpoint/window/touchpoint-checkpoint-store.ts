import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointCheckpoint } from "./touchpoint-checkpoint.js";

/** Keeps touchpoint checkpoints by code. */
export interface TouchpointCheckpointStore {
  find(code: string): TouchpointCheckpoint | undefined;
  save(item: TouchpointCheckpoint): void;
  remove(code: string): boolean;
  list(): TouchpointCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointCheckpointStore implements TouchpointCheckpointStore {
  items: Map<string, TouchpointCheckpoint>;
  order: string[];

  constructor(items: Map<string, TouchpointCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointCheckpoint): void {
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

  list(): TouchpointCheckpoint[] {
    const out: TouchpointCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointCheckpointStore(): TouchpointCheckpointStore {
  return new MemoryTouchpointCheckpointStore(new Map<string, TouchpointCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointCheckpointStore implements TouchpointCheckpointStore {
  inner: TouchpointCheckpointStore;
  cache: cache.TtlCache<TouchpointCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointCheckpointStore,
    cacheValue: cache.TtlCache<TouchpointCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointCheckpoint | undefined {
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

  save(item: TouchpointCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointCheckpointStore(inner: TouchpointCheckpointStore, ttl: number, clockValue: clock.Clock): TouchpointCheckpointStore {
  return new CachedTouchpointCheckpointStore(inner, cache.newTtlCache<TouchpointCheckpoint>(64, ttl, clockValue), 0, 0);
}

/** Selects touchpoint checkpoints. Empty fields match all. */
export class TouchpointCheckpointQuery {
  region: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMaximum: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointCheckpoint): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointCheckpoint[]): TouchpointCheckpoint[] {
    const matched = collections.filter(items, (candidate: TouchpointCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointCheckpoints(store: TouchpointCheckpointStore, query: TouchpointCheckpointQuery): TouchpointCheckpoint[] {
  return query.apply(store.list());
}
