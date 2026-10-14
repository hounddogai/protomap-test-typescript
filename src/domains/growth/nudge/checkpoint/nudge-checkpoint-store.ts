import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeCheckpoint } from "./nudge-checkpoint.js";

/** Keeps nudge checkpoints by code. */
export interface NudgeCheckpointStore {
  find(code: string): NudgeCheckpoint | undefined;
  save(item: NudgeCheckpoint): void;
  remove(code: string): boolean;
  list(): NudgeCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeCheckpointStore implements NudgeCheckpointStore {
  items: Map<string, NudgeCheckpoint>;
  order: string[];

  constructor(items: Map<string, NudgeCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeCheckpoint): void {
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

  list(): NudgeCheckpoint[] {
    const out: NudgeCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeCheckpointStore(): NudgeCheckpointStore {
  return new MemoryNudgeCheckpointStore(new Map<string, NudgeCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeCheckpointStore implements NudgeCheckpointStore {
  inner: NudgeCheckpointStore;
  cache: cache.TtlCache<NudgeCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: NudgeCheckpointStore,
    cacheValue: cache.TtlCache<NudgeCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeCheckpoint | undefined {
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

  save(item: NudgeCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedNudgeCheckpointStore(inner: NudgeCheckpointStore, ttl: number, clockValue: clock.Clock): NudgeCheckpointStore {
  return new CachedNudgeCheckpointStore(inner, cache.newTtlCache<NudgeCheckpoint>(128, ttl, clockValue), 0, 0);
}

/** Selects nudge checkpoints. Empty fields match all. */
export class NudgeCheckpointQuery {
  country: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minClicks: number, statuses: string[], limit: number) {
    this.country = country;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeCheckpoint): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeCheckpoint[]): NudgeCheckpoint[] {
    const matched = collections.filter(items, (candidate: NudgeCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeCheckpoints(store: NudgeCheckpointStore, query: NudgeCheckpointQuery): NudgeCheckpoint[] {
  return query.apply(store.list());
}
