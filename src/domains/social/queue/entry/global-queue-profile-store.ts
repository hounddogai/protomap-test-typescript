import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalQueueProfile } from "./global-queue-profile.js";

/** Keeps global queue profiles by code. */
export interface GlobalQueueProfileStore {
  find(code: string): GlobalQueueProfile | undefined;
  save(item: GlobalQueueProfile): void;
  remove(code: string): boolean;
  list(): GlobalQueueProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalQueueProfileStore implements GlobalQueueProfileStore {
  items: Map<string, GlobalQueueProfile>;
  order: string[];

  constructor(items: Map<string, GlobalQueueProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalQueueProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalQueueProfile): void {
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

  list(): GlobalQueueProfile[] {
    const out: GlobalQueueProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalQueueProfileStore(): GlobalQueueProfileStore {
  return new MemoryGlobalQueueProfileStore(new Map<string, GlobalQueueProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalQueueProfileStore implements GlobalQueueProfileStore {
  inner: GlobalQueueProfileStore;
  cache: cache.TtlCache<GlobalQueueProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalQueueProfileStore,
    cacheValue: cache.TtlCache<GlobalQueueProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalQueueProfile | undefined {
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

  save(item: GlobalQueueProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalQueueProfile[] {
    return this.inner.list();
  }
}

export function newCachedGlobalQueueProfileStore(inner: GlobalQueueProfileStore, ttl: number, clockValue: clock.Clock): GlobalQueueProfileStore {
  return new CachedGlobalQueueProfileStore(inner, cache.newTtlCache<GlobalQueueProfile>(512, ttl, clockValue), 0, 0);
}

/** Selects global queue profiles. Empty fields match all. */
export class GlobalQueueProfileQuery {
  unit: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCeiling: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalQueueProfile): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalQueueProfile[]): GlobalQueueProfile[] {
    const matched = collections.filter(items, (candidate: GlobalQueueProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalQueueProfiles(store: GlobalQueueProfileStore, query: GlobalQueueProfileQuery): GlobalQueueProfile[] {
  return query.apply(store.list());
}
