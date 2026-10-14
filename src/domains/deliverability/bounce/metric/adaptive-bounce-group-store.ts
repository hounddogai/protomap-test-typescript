import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveBounceGroup } from "./adaptive-bounce-group.js";

/** Keeps adaptive bounce groups by code. */
export interface AdaptiveBounceGroupStore {
  find(code: string): AdaptiveBounceGroup | undefined;
  save(item: AdaptiveBounceGroup): void;
  remove(code: string): boolean;
  list(): AdaptiveBounceGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveBounceGroupStore implements AdaptiveBounceGroupStore {
  items: Map<string, AdaptiveBounceGroup>;
  order: string[];

  constructor(items: Map<string, AdaptiveBounceGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveBounceGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveBounceGroup): void {
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

  list(): AdaptiveBounceGroup[] {
    const out: AdaptiveBounceGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveBounceGroupStore(): AdaptiveBounceGroupStore {
  return new MemoryAdaptiveBounceGroupStore(new Map<string, AdaptiveBounceGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveBounceGroupStore implements AdaptiveBounceGroupStore {
  inner: AdaptiveBounceGroupStore;
  cache: cache.TtlCache<AdaptiveBounceGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveBounceGroupStore,
    cacheValue: cache.TtlCache<AdaptiveBounceGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveBounceGroup | undefined {
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

  save(item: AdaptiveBounceGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveBounceGroup[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveBounceGroupStore(inner: AdaptiveBounceGroupStore, ttl: number, clockValue: clock.Clock): AdaptiveBounceGroupStore {
  return new CachedAdaptiveBounceGroupStore(inner, cache.newTtlCache<AdaptiveBounceGroup>(64, ttl, clockValue), 0, 0);
}

/** Selects adaptive bounce groups. Empty fields match all. */
export class AdaptiveBounceGroupQuery {
  channel: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minClicks: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveBounceGroup): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveBounceGroup[]): AdaptiveBounceGroup[] {
    const matched = collections.filter(items, (candidate: AdaptiveBounceGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveBounceGroups(store: AdaptiveBounceGroupStore, query: AdaptiveBounceGroupQuery): AdaptiveBounceGroup[] {
  return query.apply(store.list());
}
