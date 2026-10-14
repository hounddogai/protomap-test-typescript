import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortCheckpoint } from "./cohort-checkpoint.js";

/** Keeps cohort checkpoints by code. */
export interface CohortCheckpointStore {
  find(code: string): CohortCheckpoint | undefined;
  save(item: CohortCheckpoint): void;
  remove(code: string): boolean;
  list(): CohortCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortCheckpointStore implements CohortCheckpointStore {
  items: Map<string, CohortCheckpoint>;
  order: string[];

  constructor(items: Map<string, CohortCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortCheckpoint): void {
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

  list(): CohortCheckpoint[] {
    const out: CohortCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortCheckpointStore(): CohortCheckpointStore {
  return new MemoryCohortCheckpointStore(new Map<string, CohortCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortCheckpointStore implements CohortCheckpointStore {
  inner: CohortCheckpointStore;
  cache: cache.TtlCache<CohortCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortCheckpointStore,
    cacheValue: cache.TtlCache<CohortCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortCheckpoint | undefined {
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

  save(item: CohortCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedCohortCheckpointStore(inner: CohortCheckpointStore, ttl: number, clockValue: clock.Clock): CohortCheckpointStore {
  return new CachedCohortCheckpointStore(inner, cache.newTtlCache<CohortCheckpoint>(64, ttl, clockValue), 0, 0);
}

/** Selects cohort checkpoints. Empty fields match all. */
export class CohortCheckpointQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortCheckpoint): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortCheckpoint[]): CohortCheckpoint[] {
    const matched = collections.filter(items, (candidate: CohortCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortCheckpoints(store: CohortCheckpointStore, query: CohortCheckpointQuery): CohortCheckpoint[] {
  return query.apply(store.list());
}
