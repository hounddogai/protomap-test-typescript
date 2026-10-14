import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingNudgeCheckpoint } from "./rolling-nudge-checkpoint.js";

/** Keeps rolling nudge checkpoints by code. */
export interface RollingNudgeCheckpointStore {
  find(code: string): RollingNudgeCheckpoint | undefined;
  save(item: RollingNudgeCheckpoint): void;
  remove(code: string): boolean;
  list(): RollingNudgeCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingNudgeCheckpointStore implements RollingNudgeCheckpointStore {
  items: Map<string, RollingNudgeCheckpoint>;
  order: string[];

  constructor(items: Map<string, RollingNudgeCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingNudgeCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingNudgeCheckpoint): void {
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

  list(): RollingNudgeCheckpoint[] {
    const out: RollingNudgeCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingNudgeCheckpointStore(): RollingNudgeCheckpointStore {
  return new MemoryRollingNudgeCheckpointStore(new Map<string, RollingNudgeCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingNudgeCheckpointStore implements RollingNudgeCheckpointStore {
  inner: RollingNudgeCheckpointStore;
  cache: cache.TtlCache<RollingNudgeCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingNudgeCheckpointStore,
    cacheValue: cache.TtlCache<RollingNudgeCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingNudgeCheckpoint | undefined {
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

  save(item: RollingNudgeCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingNudgeCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedRollingNudgeCheckpointStore(inner: RollingNudgeCheckpointStore, ttl: number, clockValue: clock.Clock): RollingNudgeCheckpointStore {
  return new CachedRollingNudgeCheckpointStore(
    inner,
    cache.newTtlCache<RollingNudgeCheckpoint>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling nudge checkpoints. Empty fields match all. */
export class RollingNudgeCheckpointQuery {
  name: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMinimum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingNudgeCheckpoint): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingNudgeCheckpoint[]): RollingNudgeCheckpoint[] {
    const matched = collections.filter(items, (candidate: RollingNudgeCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingNudgeCheckpoints(store: RollingNudgeCheckpointStore, query: RollingNudgeCheckpointQuery): RollingNudgeCheckpoint[] {
  return query.apply(store.list());
}
