import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveWindowGroup } from "./adaptive-window-group.js";

/** Keeps adaptive window groups by code. */
export interface AdaptiveWindowGroupStore {
  find(code: string): AdaptiveWindowGroup | undefined;
  save(item: AdaptiveWindowGroup): void;
  remove(code: string): boolean;
  list(): AdaptiveWindowGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveWindowGroupStore implements AdaptiveWindowGroupStore {
  items: Map<string, AdaptiveWindowGroup>;
  order: string[];

  constructor(items: Map<string, AdaptiveWindowGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveWindowGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveWindowGroup): void {
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

  list(): AdaptiveWindowGroup[] {
    const out: AdaptiveWindowGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveWindowGroupStore(): AdaptiveWindowGroupStore {
  return new MemoryAdaptiveWindowGroupStore(new Map<string, AdaptiveWindowGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveWindowGroupStore implements AdaptiveWindowGroupStore {
  inner: AdaptiveWindowGroupStore;
  cache: cache.TtlCache<AdaptiveWindowGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveWindowGroupStore,
    cacheValue: cache.TtlCache<AdaptiveWindowGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveWindowGroup | undefined {
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

  save(item: AdaptiveWindowGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveWindowGroup[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveWindowGroupStore(inner: AdaptiveWindowGroupStore, ttl: number, clockValue: clock.Clock): AdaptiveWindowGroupStore {
  return new CachedAdaptiveWindowGroupStore(inner, cache.newTtlCache<AdaptiveWindowGroup>(256, ttl, clockValue), 0, 0);
}

/** Selects adaptive window groups. Empty fields match all. */
export class AdaptiveWindowGroupQuery {
  utmSource: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minDiscount: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveWindowGroup): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveWindowGroup[]): AdaptiveWindowGroup[] {
    const matched = collections.filter(items, (candidate: AdaptiveWindowGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveWindowGroups(store: AdaptiveWindowGroupStore, query: AdaptiveWindowGroupQuery): AdaptiveWindowGroup[] {
  return query.apply(store.list());
}
