import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPacingCheckpoint } from "./strict-pacing-checkpoint.js";

/** Keeps strict pacing checkpoints by code. */
export interface StrictPacingCheckpointStore {
  find(code: string): StrictPacingCheckpoint | undefined;
  save(item: StrictPacingCheckpoint): void;
  remove(code: string): boolean;
  list(): StrictPacingCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPacingCheckpointStore implements StrictPacingCheckpointStore {
  items: Map<string, StrictPacingCheckpoint>;
  order: string[];

  constructor(items: Map<string, StrictPacingCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPacingCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPacingCheckpoint): void {
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

  list(): StrictPacingCheckpoint[] {
    const out: StrictPacingCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPacingCheckpointStore(): StrictPacingCheckpointStore {
  return new MemoryStrictPacingCheckpointStore(new Map<string, StrictPacingCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPacingCheckpointStore implements StrictPacingCheckpointStore {
  inner: StrictPacingCheckpointStore;
  cache: cache.TtlCache<StrictPacingCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPacingCheckpointStore,
    cacheValue: cache.TtlCache<StrictPacingCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPacingCheckpoint | undefined {
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

  save(item: StrictPacingCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPacingCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedStrictPacingCheckpointStore(inner: StrictPacingCheckpointStore, ttl: number, clockValue: clock.Clock): StrictPacingCheckpointStore {
  return new CachedStrictPacingCheckpointStore(
    inner,
    cache.newTtlCache<StrictPacingCheckpoint>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict pacing checkpoints. Empty fields match all. */
export class StrictPacingCheckpointQuery {
  unit: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minThreshold: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictPacingCheckpoint): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPacingCheckpoint[]): StrictPacingCheckpoint[] {
    const matched = collections.filter(items, (candidate: StrictPacingCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPacingCheckpoints(store: StrictPacingCheckpointStore, query: StrictPacingCheckpointQuery): StrictPacingCheckpoint[] {
  return query.apply(store.list());
}
