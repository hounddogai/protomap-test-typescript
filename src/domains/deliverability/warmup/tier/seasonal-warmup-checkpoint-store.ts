import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalWarmupCheckpoint } from "./seasonal-warmup-checkpoint.js";

/** Keeps seasonal warmup checkpoints by code. */
export interface SeasonalWarmupCheckpointStore {
  find(code: string): SeasonalWarmupCheckpoint | undefined;
  save(item: SeasonalWarmupCheckpoint): void;
  remove(code: string): boolean;
  list(): SeasonalWarmupCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalWarmupCheckpointStore implements SeasonalWarmupCheckpointStore {
  items: Map<string, SeasonalWarmupCheckpoint>;
  order: string[];

  constructor(items: Map<string, SeasonalWarmupCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalWarmupCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalWarmupCheckpoint): void {
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

  list(): SeasonalWarmupCheckpoint[] {
    const out: SeasonalWarmupCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalWarmupCheckpointStore(): SeasonalWarmupCheckpointStore {
  return new MemorySeasonalWarmupCheckpointStore(new Map<string, SeasonalWarmupCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalWarmupCheckpointStore implements SeasonalWarmupCheckpointStore {
  inner: SeasonalWarmupCheckpointStore;
  cache: cache.TtlCache<SeasonalWarmupCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalWarmupCheckpointStore,
    cacheValue: cache.TtlCache<SeasonalWarmupCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalWarmupCheckpoint | undefined {
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

  save(item: SeasonalWarmupCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalWarmupCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalWarmupCheckpointStore(inner: SeasonalWarmupCheckpointStore, ttl: number, clockValue: clock.Clock): SeasonalWarmupCheckpointStore {
  return new CachedSeasonalWarmupCheckpointStore(
    inner,
    cache.newTtlCache<SeasonalWarmupCheckpoint>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal warmup checkpoints. Empty fields match all. */
export class SeasonalWarmupCheckpointQuery {
  locale: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSequence: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalWarmupCheckpoint): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalWarmupCheckpoint[]): SeasonalWarmupCheckpoint[] {
    const matched = collections.filter(items, (candidate: SeasonalWarmupCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalWarmupCheckpoints(store: SeasonalWarmupCheckpointStore, query: SeasonalWarmupCheckpointQuery): SeasonalWarmupCheckpoint[] {
  return query.apply(store.list());
}
