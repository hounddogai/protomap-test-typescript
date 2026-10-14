import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackChallengeCheckpoint } from "./fallback-challenge-checkpoint.js";

/** Keeps fallback challenge checkpoints by code. */
export interface FallbackChallengeCheckpointStore {
  find(code: string): FallbackChallengeCheckpoint | undefined;
  save(item: FallbackChallengeCheckpoint): void;
  remove(code: string): boolean;
  list(): FallbackChallengeCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackChallengeCheckpointStore implements FallbackChallengeCheckpointStore {
  items: Map<string, FallbackChallengeCheckpoint>;
  order: string[];

  constructor(items: Map<string, FallbackChallengeCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackChallengeCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackChallengeCheckpoint): void {
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

  list(): FallbackChallengeCheckpoint[] {
    const out: FallbackChallengeCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackChallengeCheckpointStore(): FallbackChallengeCheckpointStore {
  return new MemoryFallbackChallengeCheckpointStore(new Map<string, FallbackChallengeCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackChallengeCheckpointStore implements FallbackChallengeCheckpointStore {
  inner: FallbackChallengeCheckpointStore;
  cache: cache.TtlCache<FallbackChallengeCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackChallengeCheckpointStore,
    cacheValue: cache.TtlCache<FallbackChallengeCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackChallengeCheckpoint | undefined {
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

  save(item: FallbackChallengeCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackChallengeCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedFallbackChallengeCheckpointStore(inner: FallbackChallengeCheckpointStore, ttl: number, clockValue: clock.Clock): FallbackChallengeCheckpointStore {
  return new CachedFallbackChallengeCheckpointStore(
    inner,
    cache.newTtlCache<FallbackChallengeCheckpoint>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback challenge checkpoints. Empty fields match all. */
export class FallbackChallengeCheckpointQuery {
  channel: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCost: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackChallengeCheckpoint): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackChallengeCheckpoint[]): FallbackChallengeCheckpoint[] {
    const matched = collections.filter(items, (candidate: FallbackChallengeCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackChallengeCheckpoints(store: FallbackChallengeCheckpointStore, query: FallbackChallengeCheckpointQuery): FallbackChallengeCheckpoint[] {
  return query.apply(store.list());
}
