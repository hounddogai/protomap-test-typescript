import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptivePlacementGroup } from "./adaptive-placement-group.js";

/** Keeps adaptive placement groups by code. */
export interface AdaptivePlacementGroupStore {
  find(code: string): AdaptivePlacementGroup | undefined;
  save(item: AdaptivePlacementGroup): void;
  remove(code: string): boolean;
  list(): AdaptivePlacementGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptivePlacementGroupStore implements AdaptivePlacementGroupStore {
  items: Map<string, AdaptivePlacementGroup>;
  order: string[];

  constructor(items: Map<string, AdaptivePlacementGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptivePlacementGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptivePlacementGroup): void {
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

  list(): AdaptivePlacementGroup[] {
    const out: AdaptivePlacementGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptivePlacementGroupStore(): AdaptivePlacementGroupStore {
  return new MemoryAdaptivePlacementGroupStore(new Map<string, AdaptivePlacementGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptivePlacementGroupStore implements AdaptivePlacementGroupStore {
  inner: AdaptivePlacementGroupStore;
  cache: cache.TtlCache<AdaptivePlacementGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptivePlacementGroupStore,
    cacheValue: cache.TtlCache<AdaptivePlacementGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptivePlacementGroup | undefined {
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

  save(item: AdaptivePlacementGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptivePlacementGroup[] {
    return this.inner.list();
  }
}

export function newCachedAdaptivePlacementGroupStore(inner: AdaptivePlacementGroupStore, ttl: number, clockValue: clock.Clock): AdaptivePlacementGroupStore {
  return new CachedAdaptivePlacementGroupStore(
    inner,
    cache.newTtlCache<AdaptivePlacementGroup>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive placement groups. Empty fields match all. */
export class AdaptivePlacementGroupQuery {
  utmSource: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minThreshold: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptivePlacementGroup): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptivePlacementGroup[]): AdaptivePlacementGroup[] {
    const matched = collections.filter(items, (candidate: AdaptivePlacementGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptivePlacementGroups(store: AdaptivePlacementGroupStore, query: AdaptivePlacementGroupQuery): AdaptivePlacementGroup[] {
  return query.apply(store.list());
}
