import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelRollup } from "./level-rollup.js";

/** Keeps level rollups by code. */
export interface LevelRollupStore {
  find(code: string): LevelRollup | undefined;
  save(item: LevelRollup): void;
  remove(code: string): boolean;
  list(): LevelRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelRollupStore implements LevelRollupStore {
  items: Map<string, LevelRollup>;
  order: string[];

  constructor(items: Map<string, LevelRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelRollup): void {
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

  list(): LevelRollup[] {
    const out: LevelRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelRollupStore(): LevelRollupStore {
  return new MemoryLevelRollupStore(new Map<string, LevelRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelRollupStore implements LevelRollupStore {
  inner: LevelRollupStore;
  cache: cache.TtlCache<LevelRollup>;
  hits: number;
  misses: number;

  constructor(inner: LevelRollupStore, cacheValue: cache.TtlCache<LevelRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelRollup | undefined {
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

  save(item: LevelRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelRollup[] {
    return this.inner.list();
  }
}

export function newCachedLevelRollupStore(inner: LevelRollupStore, ttl: number, clockValue: clock.Clock): LevelRollupStore {
  return new CachedLevelRollupStore(inner, cache.newTtlCache<LevelRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects level rollups. Empty fields match all. */
export class LevelRollupQuery {
  source: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minGraceDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelRollup): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelRollup[]): LevelRollup[] {
    const matched = collections.filter(items, (candidate: LevelRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelRollups(store: LevelRollupStore, query: LevelRollupQuery): LevelRollup[] {
  return query.apply(store.list());
}
