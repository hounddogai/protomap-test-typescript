import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveComplaintGroup } from "./adaptive-complaint-group.js";

/** Keeps adaptive complaint groups by code. */
export interface AdaptiveComplaintGroupStore {
  find(code: string): AdaptiveComplaintGroup | undefined;
  save(item: AdaptiveComplaintGroup): void;
  remove(code: string): boolean;
  list(): AdaptiveComplaintGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveComplaintGroupStore implements AdaptiveComplaintGroupStore {
  items: Map<string, AdaptiveComplaintGroup>;
  order: string[];

  constructor(items: Map<string, AdaptiveComplaintGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveComplaintGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveComplaintGroup): void {
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

  list(): AdaptiveComplaintGroup[] {
    const out: AdaptiveComplaintGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveComplaintGroupStore(): AdaptiveComplaintGroupStore {
  return new MemoryAdaptiveComplaintGroupStore(new Map<string, AdaptiveComplaintGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveComplaintGroupStore implements AdaptiveComplaintGroupStore {
  inner: AdaptiveComplaintGroupStore;
  cache: cache.TtlCache<AdaptiveComplaintGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveComplaintGroupStore,
    cacheValue: cache.TtlCache<AdaptiveComplaintGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveComplaintGroup | undefined {
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

  save(item: AdaptiveComplaintGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveComplaintGroup[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveComplaintGroupStore(inner: AdaptiveComplaintGroupStore, ttl: number, clockValue: clock.Clock): AdaptiveComplaintGroupStore {
  return new CachedAdaptiveComplaintGroupStore(
    inner,
    cache.newTtlCache<AdaptiveComplaintGroup>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive complaint groups. Empty fields match all. */
export class AdaptiveComplaintGroupQuery {
  country: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMaximum: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveComplaintGroup): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveComplaintGroup[]): AdaptiveComplaintGroup[] {
    const matched = collections.filter(items, (candidate: AdaptiveComplaintGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveComplaintGroups(store: AdaptiveComplaintGroupStore, query: AdaptiveComplaintGroupQuery): AdaptiveComplaintGroup[] {
  return query.apply(store.list());
}
