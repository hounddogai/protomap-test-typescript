import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyWaitCheckpoint } from "./legacy-wait-checkpoint.js";

/** Keeps legacy wait checkpoints by code. */
export interface LegacyWaitCheckpointStore {
  find(code: string): LegacyWaitCheckpoint | undefined;
  save(item: LegacyWaitCheckpoint): void;
  remove(code: string): boolean;
  list(): LegacyWaitCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyWaitCheckpointStore implements LegacyWaitCheckpointStore {
  items: Map<string, LegacyWaitCheckpoint>;
  order: string[];

  constructor(items: Map<string, LegacyWaitCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyWaitCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyWaitCheckpoint): void {
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

  list(): LegacyWaitCheckpoint[] {
    const out: LegacyWaitCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyWaitCheckpointStore(): LegacyWaitCheckpointStore {
  return new MemoryLegacyWaitCheckpointStore(new Map<string, LegacyWaitCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyWaitCheckpointStore implements LegacyWaitCheckpointStore {
  inner: LegacyWaitCheckpointStore;
  cache: cache.TtlCache<LegacyWaitCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyWaitCheckpointStore,
    cacheValue: cache.TtlCache<LegacyWaitCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyWaitCheckpoint | undefined {
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

  save(item: LegacyWaitCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyWaitCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedLegacyWaitCheckpointStore(inner: LegacyWaitCheckpointStore, ttl: number, clockValue: clock.Clock): LegacyWaitCheckpointStore {
  return new CachedLegacyWaitCheckpointStore(
    inner,
    cache.newTtlCache<LegacyWaitCheckpoint>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy wait checkpoints. Empty fields match all. */
export class LegacyWaitCheckpointQuery {
  locale: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyWaitCheckpoint): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyWaitCheckpoint[]): LegacyWaitCheckpoint[] {
    const matched = collections.filter(items, (candidate: LegacyWaitCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyWaitCheckpoints(store: LegacyWaitCheckpointStore, query: LegacyWaitCheckpointQuery): LegacyWaitCheckpoint[] {
  return query.apply(store.list());
}
