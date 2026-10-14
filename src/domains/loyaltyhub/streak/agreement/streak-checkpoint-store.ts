import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakCheckpoint } from "./streak-checkpoint.js";

/** Keeps streak checkpoints by code. */
export interface StreakCheckpointStore {
  find(code: string): StreakCheckpoint | undefined;
  save(item: StreakCheckpoint): void;
  remove(code: string): boolean;
  list(): StreakCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakCheckpointStore implements StreakCheckpointStore {
  items: Map<string, StreakCheckpoint>;
  order: string[];

  constructor(items: Map<string, StreakCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakCheckpoint): void {
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

  list(): StreakCheckpoint[] {
    const out: StreakCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakCheckpointStore(): StreakCheckpointStore {
  return new MemoryStreakCheckpointStore(new Map<string, StreakCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakCheckpointStore implements StreakCheckpointStore {
  inner: StreakCheckpointStore;
  cache: cache.TtlCache<StreakCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: StreakCheckpointStore,
    cacheValue: cache.TtlCache<StreakCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakCheckpoint | undefined {
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

  save(item: StreakCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedStreakCheckpointStore(inner: StreakCheckpointStore, ttl: number, clockValue: clock.Clock): StreakCheckpointStore {
  return new CachedStreakCheckpointStore(inner, cache.newTtlCache<StreakCheckpoint>(1024, ttl, clockValue), 0, 0);
}

/** Selects streak checkpoints. Empty fields match all. */
export class StreakCheckpointQuery {
  title: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAttempts: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakCheckpoint): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakCheckpoint[]): StreakCheckpoint[] {
    const matched = collections.filter(items, (candidate: StreakCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakCheckpoints(store: StreakCheckpointStore, query: StreakCheckpointQuery): StreakCheckpoint[] {
  return query.apply(store.list());
}
