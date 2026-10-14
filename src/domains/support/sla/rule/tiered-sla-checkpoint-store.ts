import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredSlaCheckpoint } from "./tiered-sla-checkpoint.js";

/** Keeps tiered sla checkpoints by code. */
export interface TieredSlaCheckpointStore {
  find(code: string): TieredSlaCheckpoint | undefined;
  save(item: TieredSlaCheckpoint): void;
  remove(code: string): boolean;
  list(): TieredSlaCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredSlaCheckpointStore implements TieredSlaCheckpointStore {
  items: Map<string, TieredSlaCheckpoint>;
  order: string[];

  constructor(items: Map<string, TieredSlaCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredSlaCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredSlaCheckpoint): void {
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

  list(): TieredSlaCheckpoint[] {
    const out: TieredSlaCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredSlaCheckpointStore(): TieredSlaCheckpointStore {
  return new MemoryTieredSlaCheckpointStore(new Map<string, TieredSlaCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredSlaCheckpointStore implements TieredSlaCheckpointStore {
  inner: TieredSlaCheckpointStore;
  cache: cache.TtlCache<TieredSlaCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredSlaCheckpointStore,
    cacheValue: cache.TtlCache<TieredSlaCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredSlaCheckpoint | undefined {
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

  save(item: TieredSlaCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredSlaCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedTieredSlaCheckpointStore(inner: TieredSlaCheckpointStore, ttl: number, clockValue: clock.Clock): TieredSlaCheckpointStore {
  return new CachedTieredSlaCheckpointStore(inner, cache.newTtlCache<TieredSlaCheckpoint>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered sla checkpoints. Empty fields match all. */
export class TieredSlaCheckpointQuery {
  title: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredSlaCheckpoint): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredSlaCheckpoint[]): TieredSlaCheckpoint[] {
    const matched = collections.filter(items, (candidate: TieredSlaCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredSlaCheckpoints(store: TieredSlaCheckpointStore, query: TieredSlaCheckpointQuery): TieredSlaCheckpoint[] {
  return query.apply(store.list());
}
