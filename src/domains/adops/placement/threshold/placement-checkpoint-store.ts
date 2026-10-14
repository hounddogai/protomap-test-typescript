import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementCheckpoint } from "./placement-checkpoint.js";

/** Keeps placement checkpoints by code. */
export interface PlacementCheckpointStore {
  find(code: string): PlacementCheckpoint | undefined;
  save(item: PlacementCheckpoint): void;
  remove(code: string): boolean;
  list(): PlacementCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementCheckpointStore implements PlacementCheckpointStore {
  items: Map<string, PlacementCheckpoint>;
  order: string[];

  constructor(items: Map<string, PlacementCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementCheckpoint): void {
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

  list(): PlacementCheckpoint[] {
    const out: PlacementCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementCheckpointStore(): PlacementCheckpointStore {
  return new MemoryPlacementCheckpointStore(new Map<string, PlacementCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementCheckpointStore implements PlacementCheckpointStore {
  inner: PlacementCheckpointStore;
  cache: cache.TtlCache<PlacementCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementCheckpointStore,
    cacheValue: cache.TtlCache<PlacementCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementCheckpoint | undefined {
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

  save(item: PlacementCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedPlacementCheckpointStore(inner: PlacementCheckpointStore, ttl: number, clockValue: clock.Clock): PlacementCheckpointStore {
  return new CachedPlacementCheckpointStore(inner, cache.newTtlCache<PlacementCheckpoint>(256, ttl, clockValue), 0, 0);
}

/** Selects placement checkpoints. Empty fields match all. */
export class PlacementCheckpointQuery {
  country: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.country = country;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementCheckpoint): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementCheckpoint[]): PlacementCheckpoint[] {
    const matched = collections.filter(items, (candidate: PlacementCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementCheckpoints(store: PlacementCheckpointStore, query: PlacementCheckpointQuery): PlacementCheckpoint[] {
  return query.apply(store.list());
}
