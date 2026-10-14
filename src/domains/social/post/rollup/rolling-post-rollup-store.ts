import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingPostRollup } from "./rolling-post-rollup.js";

/** Keeps rolling post rollups by code. */
export interface RollingPostRollupStore {
  find(code: string): RollingPostRollup | undefined;
  save(item: RollingPostRollup): void;
  remove(code: string): boolean;
  list(): RollingPostRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingPostRollupStore implements RollingPostRollupStore {
  items: Map<string, RollingPostRollup>;
  order: string[];

  constructor(items: Map<string, RollingPostRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingPostRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingPostRollup): void {
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

  list(): RollingPostRollup[] {
    const out: RollingPostRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingPostRollupStore(): RollingPostRollupStore {
  return new MemoryRollingPostRollupStore(new Map<string, RollingPostRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingPostRollupStore implements RollingPostRollupStore {
  inner: RollingPostRollupStore;
  cache: cache.TtlCache<RollingPostRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingPostRollupStore,
    cacheValue: cache.TtlCache<RollingPostRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingPostRollup | undefined {
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

  save(item: RollingPostRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingPostRollup[] {
    return this.inner.list();
  }
}

export function newCachedRollingPostRollupStore(inner: RollingPostRollupStore, ttl: number, clockValue: clock.Clock): RollingPostRollupStore {
  return new CachedRollingPostRollupStore(inner, cache.newTtlCache<RollingPostRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects rolling post rollups. Empty fields match all. */
export class RollingPostRollupQuery {
  channel: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingPostRollup): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingPostRollup[]): RollingPostRollup[] {
    const matched = collections.filter(items, (candidate: RollingPostRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingPostRollups(store: RollingPostRollupStore, query: RollingPostRollupQuery): RollingPostRollup[] {
  return query.apply(store.list());
}
