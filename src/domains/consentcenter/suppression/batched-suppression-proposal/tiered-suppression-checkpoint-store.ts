import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredSuppressionCheckpoint } from "./tiered-suppression-checkpoint.js";

/** Keeps tiered suppression checkpoints by code. */
export interface TieredSuppressionCheckpointStore {
  find(code: string): TieredSuppressionCheckpoint | undefined;
  save(item: TieredSuppressionCheckpoint): void;
  remove(code: string): boolean;
  list(): TieredSuppressionCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredSuppressionCheckpointStore implements TieredSuppressionCheckpointStore {
  items: Map<string, TieredSuppressionCheckpoint>;
  order: string[];

  constructor(items: Map<string, TieredSuppressionCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredSuppressionCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredSuppressionCheckpoint): void {
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

  list(): TieredSuppressionCheckpoint[] {
    const out: TieredSuppressionCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredSuppressionCheckpointStore(): TieredSuppressionCheckpointStore {
  return new MemoryTieredSuppressionCheckpointStore(new Map<string, TieredSuppressionCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredSuppressionCheckpointStore implements TieredSuppressionCheckpointStore {
  inner: TieredSuppressionCheckpointStore;
  cache: cache.TtlCache<TieredSuppressionCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredSuppressionCheckpointStore,
    cacheValue: cache.TtlCache<TieredSuppressionCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredSuppressionCheckpoint | undefined {
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

  save(item: TieredSuppressionCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredSuppressionCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedTieredSuppressionCheckpointStore(inner: TieredSuppressionCheckpointStore, ttl: number, clockValue: clock.Clock): TieredSuppressionCheckpointStore {
  return new CachedTieredSuppressionCheckpointStore(
    inner,
    cache.newTtlCache<TieredSuppressionCheckpoint>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered suppression checkpoints. Empty fields match all. */
export class TieredSuppressionCheckpointQuery {
  channel: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minConversionRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredSuppressionCheckpoint): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredSuppressionCheckpoint[]): TieredSuppressionCheckpoint[] {
    const matched = collections.filter(items, (candidate: TieredSuppressionCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredSuppressionCheckpoints(store: TieredSuppressionCheckpointStore, query: TieredSuppressionCheckpointQuery): TieredSuppressionCheckpoint[] {
  return query.apply(store.list());
}
