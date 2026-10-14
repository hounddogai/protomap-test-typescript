import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveDoubleOptInGroup } from "./adaptive-double-opt-in-group.js";

/** Keeps adaptive double opt in groups by code. */
export interface AdaptiveDoubleOptInGroupStore {
  find(code: string): AdaptiveDoubleOptInGroup | undefined;
  save(item: AdaptiveDoubleOptInGroup): void;
  remove(code: string): boolean;
  list(): AdaptiveDoubleOptInGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveDoubleOptInGroupStore implements AdaptiveDoubleOptInGroupStore {
  items: Map<string, AdaptiveDoubleOptInGroup>;
  order: string[];

  constructor(items: Map<string, AdaptiveDoubleOptInGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveDoubleOptInGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveDoubleOptInGroup): void {
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

  list(): AdaptiveDoubleOptInGroup[] {
    const out: AdaptiveDoubleOptInGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveDoubleOptInGroupStore(): AdaptiveDoubleOptInGroupStore {
  return new MemoryAdaptiveDoubleOptInGroupStore(new Map<string, AdaptiveDoubleOptInGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveDoubleOptInGroupStore implements AdaptiveDoubleOptInGroupStore {
  inner: AdaptiveDoubleOptInGroupStore;
  cache: cache.TtlCache<AdaptiveDoubleOptInGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveDoubleOptInGroupStore,
    cacheValue: cache.TtlCache<AdaptiveDoubleOptInGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveDoubleOptInGroup | undefined {
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

  save(item: AdaptiveDoubleOptInGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveDoubleOptInGroup[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveDoubleOptInGroupStore(inner: AdaptiveDoubleOptInGroupStore, ttl: number, clockValue: clock.Clock): AdaptiveDoubleOptInGroupStore {
  return new CachedAdaptiveDoubleOptInGroupStore(
    inner,
    cache.newTtlCache<AdaptiveDoubleOptInGroup>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive double opt in groups. Empty fields match all. */
export class AdaptiveDoubleOptInGroupQuery {
  country: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minThreshold: number, statuses: string[], limit: number) {
    this.country = country;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveDoubleOptInGroup): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveDoubleOptInGroup[]): AdaptiveDoubleOptInGroup[] {
    const matched = collections.filter(items, (candidate: AdaptiveDoubleOptInGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveDoubleOptInGroups(store: AdaptiveDoubleOptInGroupStore, query: AdaptiveDoubleOptInGroupQuery): AdaptiveDoubleOptInGroup[] {
  return query.apply(store.list());
}
