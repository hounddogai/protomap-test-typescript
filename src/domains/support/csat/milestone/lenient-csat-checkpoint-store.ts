import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientCsatCheckpoint } from "./lenient-csat-checkpoint.js";

/** Keeps lenient csat checkpoints by code. */
export interface LenientCsatCheckpointStore {
  find(code: string): LenientCsatCheckpoint | undefined;
  save(item: LenientCsatCheckpoint): void;
  remove(code: string): boolean;
  list(): LenientCsatCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientCsatCheckpointStore implements LenientCsatCheckpointStore {
  items: Map<string, LenientCsatCheckpoint>;
  order: string[];

  constructor(items: Map<string, LenientCsatCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientCsatCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientCsatCheckpoint): void {
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

  list(): LenientCsatCheckpoint[] {
    const out: LenientCsatCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientCsatCheckpointStore(): LenientCsatCheckpointStore {
  return new MemoryLenientCsatCheckpointStore(new Map<string, LenientCsatCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientCsatCheckpointStore implements LenientCsatCheckpointStore {
  inner: LenientCsatCheckpointStore;
  cache: cache.TtlCache<LenientCsatCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientCsatCheckpointStore,
    cacheValue: cache.TtlCache<LenientCsatCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientCsatCheckpoint | undefined {
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

  save(item: LenientCsatCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientCsatCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedLenientCsatCheckpointStore(inner: LenientCsatCheckpointStore, ttl: number, clockValue: clock.Clock): LenientCsatCheckpointStore {
  return new CachedLenientCsatCheckpointStore(
    inner,
    cache.newTtlCache<LenientCsatCheckpoint>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient csat checkpoints. Empty fields match all. */
export class LenientCsatCheckpointQuery {
  channel: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minWindowDays: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientCsatCheckpoint): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientCsatCheckpoint[]): LenientCsatCheckpoint[] {
    const matched = collections.filter(items, (candidate: LenientCsatCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientCsatCheckpoints(store: LenientCsatCheckpointStore, query: LenientCsatCheckpointQuery): LenientCsatCheckpoint[] {
  return query.apply(store.list());
}
