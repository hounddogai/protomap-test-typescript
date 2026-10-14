import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementRollup } from "./placement-rollup.js";

/** Keeps placement rollups by code. */
export interface PlacementRollupStore {
  find(code: string): PlacementRollup | undefined;
  save(item: PlacementRollup): void;
  remove(code: string): boolean;
  list(): PlacementRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementRollupStore implements PlacementRollupStore {
  items: Map<string, PlacementRollup>;
  order: string[];

  constructor(items: Map<string, PlacementRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementRollup): void {
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

  list(): PlacementRollup[] {
    const out: PlacementRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementRollupStore(): PlacementRollupStore {
  return new MemoryPlacementRollupStore(new Map<string, PlacementRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementRollupStore implements PlacementRollupStore {
  inner: PlacementRollupStore;
  cache: cache.TtlCache<PlacementRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementRollupStore,
    cacheValue: cache.TtlCache<PlacementRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementRollup | undefined {
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

  save(item: PlacementRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementRollup[] {
    return this.inner.list();
  }
}

export function newCachedPlacementRollupStore(inner: PlacementRollupStore, ttl: number, clockValue: clock.Clock): PlacementRollupStore {
  return new CachedPlacementRollupStore(inner, cache.newTtlCache<PlacementRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects placement rollups. Empty fields match all. */
export class PlacementRollupQuery {
  channel: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minGraceDays: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementRollup): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementRollup[]): PlacementRollup[] {
    const matched = collections.filter(items, (candidate: PlacementRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementRollups(store: PlacementRollupStore, query: PlacementRollupQuery): PlacementRollup[] {
  return query.apply(store.list());
}
