import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalPreferenceRollup } from "./global-preference-rollup.js";

/** Keeps global preference rollups by code. */
export interface GlobalPreferenceRollupStore {
  find(code: string): GlobalPreferenceRollup | undefined;
  save(item: GlobalPreferenceRollup): void;
  remove(code: string): boolean;
  list(): GlobalPreferenceRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalPreferenceRollupStore implements GlobalPreferenceRollupStore {
  items: Map<string, GlobalPreferenceRollup>;
  order: string[];

  constructor(items: Map<string, GlobalPreferenceRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalPreferenceRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalPreferenceRollup): void {
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

  list(): GlobalPreferenceRollup[] {
    const out: GlobalPreferenceRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalPreferenceRollupStore(): GlobalPreferenceRollupStore {
  return new MemoryGlobalPreferenceRollupStore(new Map<string, GlobalPreferenceRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalPreferenceRollupStore implements GlobalPreferenceRollupStore {
  inner: GlobalPreferenceRollupStore;
  cache: cache.TtlCache<GlobalPreferenceRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalPreferenceRollupStore,
    cacheValue: cache.TtlCache<GlobalPreferenceRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalPreferenceRollup | undefined {
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

  save(item: GlobalPreferenceRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalPreferenceRollup[] {
    return this.inner.list();
  }
}

export function newCachedGlobalPreferenceRollupStore(inner: GlobalPreferenceRollupStore, ttl: number, clockValue: clock.Clock): GlobalPreferenceRollupStore {
  return new CachedGlobalPreferenceRollupStore(
    inner,
    cache.newTtlCache<GlobalPreferenceRollup>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global preference rollups. Empty fields match all. */
export class GlobalPreferenceRollupQuery {
  segment: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalPreferenceRollup): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalPreferenceRollup[]): GlobalPreferenceRollup[] {
    const matched = collections.filter(items, (candidate: GlobalPreferenceRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalPreferenceRollups(store: GlobalPreferenceRollupStore, query: GlobalPreferenceRollupQuery): GlobalPreferenceRollup[] {
  return query.apply(store.list());
}
