import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalModelCheckpoint } from "./seasonal-model-checkpoint.js";

/** Keeps seasonal model checkpoints by code. */
export interface SeasonalModelCheckpointStore {
  find(code: string): SeasonalModelCheckpoint | undefined;
  save(item: SeasonalModelCheckpoint): void;
  remove(code: string): boolean;
  list(): SeasonalModelCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalModelCheckpointStore implements SeasonalModelCheckpointStore {
  items: Map<string, SeasonalModelCheckpoint>;
  order: string[];

  constructor(items: Map<string, SeasonalModelCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalModelCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalModelCheckpoint): void {
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

  list(): SeasonalModelCheckpoint[] {
    const out: SeasonalModelCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalModelCheckpointStore(): SeasonalModelCheckpointStore {
  return new MemorySeasonalModelCheckpointStore(new Map<string, SeasonalModelCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalModelCheckpointStore implements SeasonalModelCheckpointStore {
  inner: SeasonalModelCheckpointStore;
  cache: cache.TtlCache<SeasonalModelCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalModelCheckpointStore,
    cacheValue: cache.TtlCache<SeasonalModelCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalModelCheckpoint | undefined {
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

  save(item: SeasonalModelCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalModelCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalModelCheckpointStore(inner: SeasonalModelCheckpointStore, ttl: number, clockValue: clock.Clock): SeasonalModelCheckpointStore {
  return new CachedSeasonalModelCheckpointStore(
    inner,
    cache.newTtlCache<SeasonalModelCheckpoint>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal model checkpoints. Empty fields match all. */
export class SeasonalModelCheckpointQuery {
  channel: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSequence: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalModelCheckpoint): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalModelCheckpoint[]): SeasonalModelCheckpoint[] {
    const matched = collections.filter(items, (candidate: SeasonalModelCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalModelCheckpoints(store: SeasonalModelCheckpointStore, query: SeasonalModelCheckpointQuery): SeasonalModelCheckpoint[] {
  return query.apply(store.list());
}
