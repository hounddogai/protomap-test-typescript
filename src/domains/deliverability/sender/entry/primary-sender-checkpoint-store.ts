import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimarySenderCheckpoint } from "./primary-sender-checkpoint.js";

/** Keeps primary sender checkpoints by code. */
export interface PrimarySenderCheckpointStore {
  find(code: string): PrimarySenderCheckpoint | undefined;
  save(item: PrimarySenderCheckpoint): void;
  remove(code: string): boolean;
  list(): PrimarySenderCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimarySenderCheckpointStore implements PrimarySenderCheckpointStore {
  items: Map<string, PrimarySenderCheckpoint>;
  order: string[];

  constructor(items: Map<string, PrimarySenderCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimarySenderCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimarySenderCheckpoint): void {
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

  list(): PrimarySenderCheckpoint[] {
    const out: PrimarySenderCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimarySenderCheckpointStore(): PrimarySenderCheckpointStore {
  return new MemoryPrimarySenderCheckpointStore(new Map<string, PrimarySenderCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimarySenderCheckpointStore implements PrimarySenderCheckpointStore {
  inner: PrimarySenderCheckpointStore;
  cache: cache.TtlCache<PrimarySenderCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimarySenderCheckpointStore,
    cacheValue: cache.TtlCache<PrimarySenderCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimarySenderCheckpoint | undefined {
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

  save(item: PrimarySenderCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimarySenderCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedPrimarySenderCheckpointStore(inner: PrimarySenderCheckpointStore, ttl: number, clockValue: clock.Clock): PrimarySenderCheckpointStore {
  return new CachedPrimarySenderCheckpointStore(
    inner,
    cache.newTtlCache<PrimarySenderCheckpoint>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary sender checkpoints. Empty fields match all. */
export class PrimarySenderCheckpointQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimarySenderCheckpoint): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimarySenderCheckpoint[]): PrimarySenderCheckpoint[] {
    const matched = collections.filter(items, (candidate: PrimarySenderCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimarySenderCheckpoints(store: PrimarySenderCheckpointStore, query: PrimarySenderCheckpointQuery): PrimarySenderCheckpoint[] {
  return query.apply(store.list());
}
