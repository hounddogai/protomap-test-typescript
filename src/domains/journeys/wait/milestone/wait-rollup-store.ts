import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitRollup } from "./wait-rollup.js";

/** Keeps wait rollups by code. */
export interface WaitRollupStore {
  find(code: string): WaitRollup | undefined;
  save(item: WaitRollup): void;
  remove(code: string): boolean;
  list(): WaitRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitRollupStore implements WaitRollupStore {
  items: Map<string, WaitRollup>;
  order: string[];

  constructor(items: Map<string, WaitRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitRollup): void {
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

  list(): WaitRollup[] {
    const out: WaitRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitRollupStore(): WaitRollupStore {
  return new MemoryWaitRollupStore(new Map<string, WaitRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitRollupStore implements WaitRollupStore {
  inner: WaitRollupStore;
  cache: cache.TtlCache<WaitRollup>;
  hits: number;
  misses: number;

  constructor(inner: WaitRollupStore, cacheValue: cache.TtlCache<WaitRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitRollup | undefined {
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

  save(item: WaitRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitRollup[] {
    return this.inner.list();
  }
}

export function newCachedWaitRollupStore(inner: WaitRollupStore, ttl: number, clockValue: clock.Clock): WaitRollupStore {
  return new CachedWaitRollupStore(inner, cache.newTtlCache<WaitRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects wait rollups. Empty fields match all. */
export class WaitRollupQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitRollup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitRollup[]): WaitRollup[] {
    const matched = collections.filter(items, (candidate: WaitRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitRollups(store: WaitRollupStore, query: WaitRollupQuery): WaitRollup[] {
  return query.apply(store.list());
}
