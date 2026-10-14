import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveDomainGroup } from "./adaptive-domain-group.js";

/** Keeps adaptive domain groups by code. */
export interface AdaptiveDomainGroupStore {
  find(code: string): AdaptiveDomainGroup | undefined;
  save(item: AdaptiveDomainGroup): void;
  remove(code: string): boolean;
  list(): AdaptiveDomainGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveDomainGroupStore implements AdaptiveDomainGroupStore {
  items: Map<string, AdaptiveDomainGroup>;
  order: string[];

  constructor(items: Map<string, AdaptiveDomainGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveDomainGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveDomainGroup): void {
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

  list(): AdaptiveDomainGroup[] {
    const out: AdaptiveDomainGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveDomainGroupStore(): AdaptiveDomainGroupStore {
  return new MemoryAdaptiveDomainGroupStore(new Map<string, AdaptiveDomainGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveDomainGroupStore implements AdaptiveDomainGroupStore {
  inner: AdaptiveDomainGroupStore;
  cache: cache.TtlCache<AdaptiveDomainGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveDomainGroupStore,
    cacheValue: cache.TtlCache<AdaptiveDomainGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveDomainGroup | undefined {
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

  save(item: AdaptiveDomainGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveDomainGroup[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveDomainGroupStore(inner: AdaptiveDomainGroupStore, ttl: number, clockValue: clock.Clock): AdaptiveDomainGroupStore {
  return new CachedAdaptiveDomainGroupStore(inner, cache.newTtlCache<AdaptiveDomainGroup>(256, ttl, clockValue), 0, 0);
}

/** Selects adaptive domain groups. Empty fields match all. */
export class AdaptiveDomainGroupQuery {
  title: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRatio: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveDomainGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveDomainGroup[]): AdaptiveDomainGroup[] {
    const matched = collections.filter(items, (candidate: AdaptiveDomainGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveDomainGroups(store: AdaptiveDomainGroupStore, query: AdaptiveDomainGroupQuery): AdaptiveDomainGroup[] {
  return query.apply(store.list());
}
