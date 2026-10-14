import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyStreakCheckpoint } from "./legacy-streak-checkpoint.js";

/** Keeps legacy streak checkpoints by code. */
export interface LegacyStreakCheckpointStore {
  find(code: string): LegacyStreakCheckpoint | undefined;
  save(item: LegacyStreakCheckpoint): void;
  remove(code: string): boolean;
  list(): LegacyStreakCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyStreakCheckpointStore implements LegacyStreakCheckpointStore {
  items: Map<string, LegacyStreakCheckpoint>;
  order: string[];

  constructor(items: Map<string, LegacyStreakCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyStreakCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyStreakCheckpoint): void {
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

  list(): LegacyStreakCheckpoint[] {
    const out: LegacyStreakCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyStreakCheckpointStore(): LegacyStreakCheckpointStore {
  return new MemoryLegacyStreakCheckpointStore(new Map<string, LegacyStreakCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyStreakCheckpointStore implements LegacyStreakCheckpointStore {
  inner: LegacyStreakCheckpointStore;
  cache: cache.TtlCache<LegacyStreakCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyStreakCheckpointStore,
    cacheValue: cache.TtlCache<LegacyStreakCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyStreakCheckpoint | undefined {
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

  save(item: LegacyStreakCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyStreakCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedLegacyStreakCheckpointStore(inner: LegacyStreakCheckpointStore, ttl: number, clockValue: clock.Clock): LegacyStreakCheckpointStore {
  return new CachedLegacyStreakCheckpointStore(
    inner,
    cache.newTtlCache<LegacyStreakCheckpoint>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy streak checkpoints. Empty fields match all. */
export class LegacyStreakCheckpointQuery {
  title: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minFloorValue: number, statuses: string[], limit: number) {
    this.title = title;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyStreakCheckpoint): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyStreakCheckpoint[]): LegacyStreakCheckpoint[] {
    const matched = collections.filter(items, (candidate: LegacyStreakCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyStreakCheckpoints(store: LegacyStreakCheckpointStore, query: LegacyStreakCheckpointQuery): LegacyStreakCheckpoint[] {
  return query.apply(store.list());
}
