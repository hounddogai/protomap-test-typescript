import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceCheckpoint } from "./bounce-checkpoint.js";

/** Keeps bounce checkpoints by code. */
export interface BounceCheckpointStore {
  find(code: string): BounceCheckpoint | undefined;
  save(item: BounceCheckpoint): void;
  remove(code: string): boolean;
  list(): BounceCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceCheckpointStore implements BounceCheckpointStore {
  items: Map<string, BounceCheckpoint>;
  order: string[];

  constructor(items: Map<string, BounceCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceCheckpoint): void {
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

  list(): BounceCheckpoint[] {
    const out: BounceCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceCheckpointStore(): BounceCheckpointStore {
  return new MemoryBounceCheckpointStore(new Map<string, BounceCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceCheckpointStore implements BounceCheckpointStore {
  inner: BounceCheckpointStore;
  cache: cache.TtlCache<BounceCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: BounceCheckpointStore,
    cacheValue: cache.TtlCache<BounceCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceCheckpoint | undefined {
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

  save(item: BounceCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedBounceCheckpointStore(inner: BounceCheckpointStore, ttl: number, clockValue: clock.Clock): BounceCheckpointStore {
  return new CachedBounceCheckpointStore(inner, cache.newTtlCache<BounceCheckpoint>(128, ttl, clockValue), 0, 0);
}

/** Selects bounce checkpoints. Empty fields match all. */
export class BounceCheckpointQuery {
  label: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minThreshold: number, statuses: string[], limit: number) {
    this.label = label;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceCheckpoint): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceCheckpoint[]): BounceCheckpoint[] {
    const matched = collections.filter(items, (candidate: BounceCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceCheckpoints(store: BounceCheckpointStore, query: BounceCheckpointQuery): BounceCheckpoint[] {
  return query.apply(store.list());
}
