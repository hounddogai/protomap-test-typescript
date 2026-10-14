import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementOverride } from "./placement-override.js";

/** Keeps placement overrides by code. */
export interface PlacementOverrideStore {
  find(code: string): PlacementOverride | undefined;
  save(item: PlacementOverride): void;
  remove(code: string): boolean;
  list(): PlacementOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementOverrideStore implements PlacementOverrideStore {
  items: Map<string, PlacementOverride>;
  order: string[];

  constructor(items: Map<string, PlacementOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementOverride): void {
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

  list(): PlacementOverride[] {
    const out: PlacementOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementOverrideStore(): PlacementOverrideStore {
  return new MemoryPlacementOverrideStore(new Map<string, PlacementOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementOverrideStore implements PlacementOverrideStore {
  inner: PlacementOverrideStore;
  cache: cache.TtlCache<PlacementOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementOverrideStore,
    cacheValue: cache.TtlCache<PlacementOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementOverride | undefined {
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

  save(item: PlacementOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementOverride[] {
    return this.inner.list();
  }
}

export function newCachedPlacementOverrideStore(inner: PlacementOverrideStore, ttl: number, clockValue: clock.Clock): PlacementOverrideStore {
  return new CachedPlacementOverrideStore(inner, cache.newTtlCache<PlacementOverride>(64, ttl, clockValue), 0, 0);
}

/** Selects placement overrides. Empty fields match all. */
export class PlacementOverrideQuery {
  channel: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFloorValue: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementOverride): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementOverride[]): PlacementOverride[] {
    const matched = collections.filter(items, (candidate: PlacementOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementOverrides(store: PlacementOverrideStore, query: PlacementOverrideQuery): PlacementOverride[] {
  return query.apply(store.list());
}
