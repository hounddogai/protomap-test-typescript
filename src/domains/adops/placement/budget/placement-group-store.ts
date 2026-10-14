import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementGroup } from "./placement-group.js";

/** Keeps placement groups by code. */
export interface PlacementGroupStore {
  find(code: string): PlacementGroup | undefined;
  save(item: PlacementGroup): void;
  remove(code: string): boolean;
  list(): PlacementGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementGroupStore implements PlacementGroupStore {
  items: Map<string, PlacementGroup>;
  order: string[];

  constructor(items: Map<string, PlacementGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementGroup): void {
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

  list(): PlacementGroup[] {
    const out: PlacementGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementGroupStore(): PlacementGroupStore {
  return new MemoryPlacementGroupStore(new Map<string, PlacementGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementGroupStore implements PlacementGroupStore {
  inner: PlacementGroupStore;
  cache: cache.TtlCache<PlacementGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementGroupStore,
    cacheValue: cache.TtlCache<PlacementGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementGroup | undefined {
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

  save(item: PlacementGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementGroup[] {
    return this.inner.list();
  }
}

export function newCachedPlacementGroupStore(inner: PlacementGroupStore, ttl: number, clockValue: clock.Clock): PlacementGroupStore {
  return new CachedPlacementGroupStore(inner, cache.newTtlCache<PlacementGroup>(1024, ttl, clockValue), 0, 0);
}

/** Selects placement groups. Empty fields match all. */
export class PlacementGroupQuery {
  source: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minLimit: number, statuses: string[], limit: number) {
    this.source = source;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementGroup): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementGroup[]): PlacementGroup[] {
    const matched = collections.filter(items, (candidate: PlacementGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementGroups(store: PlacementGroupStore, query: PlacementGroupQuery): PlacementGroup[] {
  return query.apply(store.list());
}
