import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionCheckpoint } from "./deflection-checkpoint.js";

/** Keeps deflection checkpoints by code. */
export interface DeflectionCheckpointStore {
  find(code: string): DeflectionCheckpoint | undefined;
  save(item: DeflectionCheckpoint): void;
  remove(code: string): boolean;
  list(): DeflectionCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionCheckpointStore implements DeflectionCheckpointStore {
  items: Map<string, DeflectionCheckpoint>;
  order: string[];

  constructor(items: Map<string, DeflectionCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionCheckpoint): void {
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

  list(): DeflectionCheckpoint[] {
    const out: DeflectionCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionCheckpointStore(): DeflectionCheckpointStore {
  return new MemoryDeflectionCheckpointStore(new Map<string, DeflectionCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionCheckpointStore implements DeflectionCheckpointStore {
  inner: DeflectionCheckpointStore;
  cache: cache.TtlCache<DeflectionCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionCheckpointStore,
    cacheValue: cache.TtlCache<DeflectionCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionCheckpoint | undefined {
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

  save(item: DeflectionCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionCheckpointStore(inner: DeflectionCheckpointStore, ttl: number, clockValue: clock.Clock): DeflectionCheckpointStore {
  return new CachedDeflectionCheckpointStore(
    inner,
    cache.newTtlCache<DeflectionCheckpoint>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects deflection checkpoints. Empty fields match all. */
export class DeflectionCheckpointQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionCheckpoint): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionCheckpoint[]): DeflectionCheckpoint[] {
    const matched = collections.filter(items, (candidate: DeflectionCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionCheckpoints(store: DeflectionCheckpointStore, query: DeflectionCheckpointQuery): DeflectionCheckpoint[] {
  return query.apply(store.list());
}
