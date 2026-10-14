import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingConversionCheckpoint } from "./pending-conversion-checkpoint.js";

/** Keeps pending conversion checkpoints by code. */
export interface PendingConversionCheckpointStore {
  find(code: string): PendingConversionCheckpoint | undefined;
  save(item: PendingConversionCheckpoint): void;
  remove(code: string): boolean;
  list(): PendingConversionCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingConversionCheckpointStore implements PendingConversionCheckpointStore {
  items: Map<string, PendingConversionCheckpoint>;
  order: string[];

  constructor(items: Map<string, PendingConversionCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingConversionCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingConversionCheckpoint): void {
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

  list(): PendingConversionCheckpoint[] {
    const out: PendingConversionCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingConversionCheckpointStore(): PendingConversionCheckpointStore {
  return new MemoryPendingConversionCheckpointStore(new Map<string, PendingConversionCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingConversionCheckpointStore implements PendingConversionCheckpointStore {
  inner: PendingConversionCheckpointStore;
  cache: cache.TtlCache<PendingConversionCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingConversionCheckpointStore,
    cacheValue: cache.TtlCache<PendingConversionCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingConversionCheckpoint | undefined {
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

  save(item: PendingConversionCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingConversionCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedPendingConversionCheckpointStore(inner: PendingConversionCheckpointStore, ttl: number, clockValue: clock.Clock): PendingConversionCheckpointStore {
  return new CachedPendingConversionCheckpointStore(
    inner,
    cache.newTtlCache<PendingConversionCheckpoint>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending conversion checkpoints. Empty fields match all. */
export class PendingConversionCheckpointQuery {
  country: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBid: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingConversionCheckpoint): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingConversionCheckpoint[]): PendingConversionCheckpoint[] {
    const matched = collections.filter(items, (candidate: PendingConversionCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingConversionCheckpoints(store: PendingConversionCheckpointStore, query: PendingConversionCheckpointQuery): PendingConversionCheckpoint[] {
  return query.apply(store.list());
}
