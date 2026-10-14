import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitCheckpoint } from "./wait-checkpoint.js";

/** Keeps wait checkpoints by code. */
export interface WaitCheckpointStore {
  find(code: string): WaitCheckpoint | undefined;
  save(item: WaitCheckpoint): void;
  remove(code: string): boolean;
  list(): WaitCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitCheckpointStore implements WaitCheckpointStore {
  items: Map<string, WaitCheckpoint>;
  order: string[];

  constructor(items: Map<string, WaitCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitCheckpoint): void {
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

  list(): WaitCheckpoint[] {
    const out: WaitCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitCheckpointStore(): WaitCheckpointStore {
  return new MemoryWaitCheckpointStore(new Map<string, WaitCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitCheckpointStore implements WaitCheckpointStore {
  inner: WaitCheckpointStore;
  cache: cache.TtlCache<WaitCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: WaitCheckpointStore,
    cacheValue: cache.TtlCache<WaitCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitCheckpoint | undefined {
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

  save(item: WaitCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedWaitCheckpointStore(inner: WaitCheckpointStore, ttl: number, clockValue: clock.Clock): WaitCheckpointStore {
  return new CachedWaitCheckpointStore(inner, cache.newTtlCache<WaitCheckpoint>(64, ttl, clockValue), 0, 0);
}

/** Selects wait checkpoints. Empty fields match all. */
export class WaitCheckpointQuery {
  channel: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAttempts: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitCheckpoint): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitCheckpoint[]): WaitCheckpoint[] {
    const matched = collections.filter(items, (candidate: WaitCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitCheckpoints(store: WaitCheckpointStore, query: WaitCheckpointQuery): WaitCheckpoint[] {
  return query.apply(store.list());
}
