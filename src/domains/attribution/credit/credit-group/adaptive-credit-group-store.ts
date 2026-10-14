import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveCreditGroup } from "./adaptive-credit-group.js";

/** Keeps adaptive credit groups by code. */
export interface AdaptiveCreditGroupStore {
  find(code: string): AdaptiveCreditGroup | undefined;
  save(item: AdaptiveCreditGroup): void;
  remove(code: string): boolean;
  list(): AdaptiveCreditGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveCreditGroupStore implements AdaptiveCreditGroupStore {
  items: Map<string, AdaptiveCreditGroup>;
  order: string[];

  constructor(items: Map<string, AdaptiveCreditGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveCreditGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveCreditGroup): void {
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

  list(): AdaptiveCreditGroup[] {
    const out: AdaptiveCreditGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveCreditGroupStore(): AdaptiveCreditGroupStore {
  return new MemoryAdaptiveCreditGroupStore(new Map<string, AdaptiveCreditGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveCreditGroupStore implements AdaptiveCreditGroupStore {
  inner: AdaptiveCreditGroupStore;
  cache: cache.TtlCache<AdaptiveCreditGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveCreditGroupStore,
    cacheValue: cache.TtlCache<AdaptiveCreditGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveCreditGroup | undefined {
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

  save(item: AdaptiveCreditGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveCreditGroup[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveCreditGroupStore(inner: AdaptiveCreditGroupStore, ttl: number, clockValue: clock.Clock): AdaptiveCreditGroupStore {
  return new CachedAdaptiveCreditGroupStore(inner, cache.newTtlCache<AdaptiveCreditGroup>(512, ttl, clockValue), 0, 0);
}

/** Selects adaptive credit groups. Empty fields match all. */
export class AdaptiveCreditGroupQuery {
  title: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minThreshold: number, statuses: string[], limit: number) {
    this.title = title;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveCreditGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveCreditGroup[]): AdaptiveCreditGroup[] {
    const matched = collections.filter(items, (candidate: AdaptiveCreditGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveCreditGroups(store: AdaptiveCreditGroupStore, query: AdaptiveCreditGroupQuery): AdaptiveCreditGroup[] {
  return query.apply(store.list());
}
