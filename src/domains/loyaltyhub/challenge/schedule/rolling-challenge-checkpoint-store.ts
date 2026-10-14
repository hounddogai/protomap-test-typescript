import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingChallengeCheckpoint } from "./rolling-challenge-checkpoint.js";

/** Keeps rolling challenge checkpoints by code. */
export interface RollingChallengeCheckpointStore {
  find(code: string): RollingChallengeCheckpoint | undefined;
  save(item: RollingChallengeCheckpoint): void;
  remove(code: string): boolean;
  list(): RollingChallengeCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingChallengeCheckpointStore implements RollingChallengeCheckpointStore {
  items: Map<string, RollingChallengeCheckpoint>;
  order: string[];

  constructor(items: Map<string, RollingChallengeCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingChallengeCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingChallengeCheckpoint): void {
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

  list(): RollingChallengeCheckpoint[] {
    const out: RollingChallengeCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingChallengeCheckpointStore(): RollingChallengeCheckpointStore {
  return new MemoryRollingChallengeCheckpointStore(new Map<string, RollingChallengeCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingChallengeCheckpointStore implements RollingChallengeCheckpointStore {
  inner: RollingChallengeCheckpointStore;
  cache: cache.TtlCache<RollingChallengeCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingChallengeCheckpointStore,
    cacheValue: cache.TtlCache<RollingChallengeCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingChallengeCheckpoint | undefined {
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

  save(item: RollingChallengeCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingChallengeCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedRollingChallengeCheckpointStore(inner: RollingChallengeCheckpointStore, ttl: number, clockValue: clock.Clock): RollingChallengeCheckpointStore {
  return new CachedRollingChallengeCheckpointStore(
    inner,
    cache.newTtlCache<RollingChallengeCheckpoint>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling challenge checkpoints. Empty fields match all. */
export class RollingChallengeCheckpointQuery {
  unit: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minPriority: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingChallengeCheckpoint): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingChallengeCheckpoint[]): RollingChallengeCheckpoint[] {
    const matched = collections.filter(items, (candidate: RollingChallengeCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingChallengeCheckpoints(store: RollingChallengeCheckpointStore, query: RollingChallengeCheckpointQuery): RollingChallengeCheckpoint[] {
  return query.apply(store.list());
}
