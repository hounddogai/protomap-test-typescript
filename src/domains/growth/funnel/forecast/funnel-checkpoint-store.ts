import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelCheckpoint } from "./funnel-checkpoint.js";

/** Keeps funnel checkpoints by code. */
export interface FunnelCheckpointStore {
  find(code: string): FunnelCheckpoint | undefined;
  save(item: FunnelCheckpoint): void;
  remove(code: string): boolean;
  list(): FunnelCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelCheckpointStore implements FunnelCheckpointStore {
  items: Map<string, FunnelCheckpoint>;
  order: string[];

  constructor(items: Map<string, FunnelCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelCheckpoint): void {
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

  list(): FunnelCheckpoint[] {
    const out: FunnelCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelCheckpointStore(): FunnelCheckpointStore {
  return new MemoryFunnelCheckpointStore(new Map<string, FunnelCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelCheckpointStore implements FunnelCheckpointStore {
  inner: FunnelCheckpointStore;
  cache: cache.TtlCache<FunnelCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: FunnelCheckpointStore,
    cacheValue: cache.TtlCache<FunnelCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelCheckpoint | undefined {
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

  save(item: FunnelCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedFunnelCheckpointStore(inner: FunnelCheckpointStore, ttl: number, clockValue: clock.Clock): FunnelCheckpointStore {
  return new CachedFunnelCheckpointStore(inner, cache.newTtlCache<FunnelCheckpoint>(128, ttl, clockValue), 0, 0);
}

/** Selects funnel checkpoints. Empty fields match all. */
export class FunnelCheckpointQuery {
  label: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minEndsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelCheckpoint): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelCheckpoint[]): FunnelCheckpoint[] {
    const matched = collections.filter(items, (candidate: FunnelCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelCheckpoints(store: FunnelCheckpointStore, query: FunnelCheckpointQuery): FunnelCheckpoint[] {
  return query.apply(store.list());
}
