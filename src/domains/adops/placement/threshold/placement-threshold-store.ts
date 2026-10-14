import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementThreshold } from "./placement-threshold.js";

/** Keeps placement thresholds by code. */
export interface PlacementThresholdStore {
  find(code: string): PlacementThreshold | undefined;
  save(item: PlacementThreshold): void;
  remove(code: string): boolean;
  list(): PlacementThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementThresholdStore implements PlacementThresholdStore {
  items: Map<string, PlacementThreshold>;
  order: string[];

  constructor(items: Map<string, PlacementThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementThreshold): void {
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

  list(): PlacementThreshold[] {
    const out: PlacementThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementThresholdStore(): PlacementThresholdStore {
  return new MemoryPlacementThresholdStore(new Map<string, PlacementThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementThresholdStore implements PlacementThresholdStore {
  inner: PlacementThresholdStore;
  cache: cache.TtlCache<PlacementThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementThresholdStore,
    cacheValue: cache.TtlCache<PlacementThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementThreshold | undefined {
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

  save(item: PlacementThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementThreshold[] {
    return this.inner.list();
  }
}

export function newCachedPlacementThresholdStore(inner: PlacementThresholdStore, ttl: number, clockValue: clock.Clock): PlacementThresholdStore {
  return new CachedPlacementThresholdStore(inner, cache.newTtlCache<PlacementThreshold>(128, ttl, clockValue), 0, 0);
}

/** Selects placement thresholds. Empty fields match all. */
export class PlacementThresholdQuery {
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

  matches(item: PlacementThreshold): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementThreshold[]): PlacementThreshold[] {
    const matched = collections.filter(items, (candidate: PlacementThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementThresholds(store: PlacementThresholdStore, query: PlacementThresholdQuery): PlacementThreshold[] {
  return query.apply(store.list());
}
