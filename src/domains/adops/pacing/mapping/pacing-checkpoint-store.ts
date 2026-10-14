import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingCheckpoint } from "./pacing-checkpoint.js";

/** Keeps pacing checkpoints by code. */
export interface PacingCheckpointStore {
  find(code: string): PacingCheckpoint | undefined;
  save(item: PacingCheckpoint): void;
  remove(code: string): boolean;
  list(): PacingCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingCheckpointStore implements PacingCheckpointStore {
  items: Map<string, PacingCheckpoint>;
  order: string[];

  constructor(items: Map<string, PacingCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingCheckpoint): void {
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

  list(): PacingCheckpoint[] {
    const out: PacingCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingCheckpointStore(): PacingCheckpointStore {
  return new MemoryPacingCheckpointStore(new Map<string, PacingCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingCheckpointStore implements PacingCheckpointStore {
  inner: PacingCheckpointStore;
  cache: cache.TtlCache<PacingCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: PacingCheckpointStore,
    cacheValue: cache.TtlCache<PacingCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingCheckpoint | undefined {
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

  save(item: PacingCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedPacingCheckpointStore(inner: PacingCheckpointStore, ttl: number, clockValue: clock.Clock): PacingCheckpointStore {
  return new CachedPacingCheckpointStore(inner, cache.newTtlCache<PacingCheckpoint>(256, ttl, clockValue), 0, 0);
}

/** Selects pacing checkpoints. Empty fields match all. */
export class PacingCheckpointQuery {
  name: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCapacity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingCheckpoint): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingCheckpoint[]): PacingCheckpoint[] {
    const matched = collections.filter(items, (candidate: PacingCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingCheckpoints(store: PacingCheckpointStore, query: PacingCheckpointQuery): PacingCheckpoint[] {
  return query.apply(store.list());
}
