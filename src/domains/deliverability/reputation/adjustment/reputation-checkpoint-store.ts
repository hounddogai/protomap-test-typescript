import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationCheckpoint } from "./reputation-checkpoint.js";

/** Keeps reputation checkpoints by code. */
export interface ReputationCheckpointStore {
  find(code: string): ReputationCheckpoint | undefined;
  save(item: ReputationCheckpoint): void;
  remove(code: string): boolean;
  list(): ReputationCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationCheckpointStore implements ReputationCheckpointStore {
  items: Map<string, ReputationCheckpoint>;
  order: string[];

  constructor(items: Map<string, ReputationCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationCheckpoint): void {
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

  list(): ReputationCheckpoint[] {
    const out: ReputationCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationCheckpointStore(): ReputationCheckpointStore {
  return new MemoryReputationCheckpointStore(new Map<string, ReputationCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationCheckpointStore implements ReputationCheckpointStore {
  inner: ReputationCheckpointStore;
  cache: cache.TtlCache<ReputationCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationCheckpointStore,
    cacheValue: cache.TtlCache<ReputationCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationCheckpoint | undefined {
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

  save(item: ReputationCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedReputationCheckpointStore(inner: ReputationCheckpointStore, ttl: number, clockValue: clock.Clock): ReputationCheckpointStore {
  return new CachedReputationCheckpointStore(
    inner,
    cache.newTtlCache<ReputationCheckpoint>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects reputation checkpoints. Empty fields match all. */
export class ReputationCheckpointQuery {
  region: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minWeight: number, statuses: string[], limit: number) {
    this.region = region;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationCheckpoint): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationCheckpoint[]): ReputationCheckpoint[] {
    const matched = collections.filter(items, (candidate: ReputationCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationCheckpoints(store: ReputationCheckpointStore, query: ReputationCheckpointQuery): ReputationCheckpoint[] {
  return query.apply(store.list());
}
