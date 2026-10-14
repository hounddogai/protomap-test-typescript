import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelEstimate } from "./level-estimate.js";

/** Keeps level estimates by code. */
export interface LevelEstimateStore {
  find(code: string): LevelEstimate | undefined;
  save(item: LevelEstimate): void;
  remove(code: string): boolean;
  list(): LevelEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelEstimateStore implements LevelEstimateStore {
  items: Map<string, LevelEstimate>;
  order: string[];

  constructor(items: Map<string, LevelEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelEstimate): void {
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

  list(): LevelEstimate[] {
    const out: LevelEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelEstimateStore(): LevelEstimateStore {
  return new MemoryLevelEstimateStore(new Map<string, LevelEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelEstimateStore implements LevelEstimateStore {
  inner: LevelEstimateStore;
  cache: cache.TtlCache<LevelEstimate>;
  hits: number;
  misses: number;

  constructor(inner: LevelEstimateStore, cacheValue: cache.TtlCache<LevelEstimate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelEstimate | undefined {
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

  save(item: LevelEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelEstimate[] {
    return this.inner.list();
  }
}

export function newCachedLevelEstimateStore(inner: LevelEstimateStore, ttl: number, clockValue: clock.Clock): LevelEstimateStore {
  return new CachedLevelEstimateStore(inner, cache.newTtlCache<LevelEstimate>(512, ttl, clockValue), 0, 0);
}

/** Selects level estimates. Empty fields match all. */
export class LevelEstimateQuery {
  name: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBid: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelEstimate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelEstimate[]): LevelEstimate[] {
    const matched = collections.filter(items, (candidate: LevelEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelEstimates(store: LevelEstimateStore, query: LevelEstimateQuery): LevelEstimate[] {
  return query.apply(store.list());
}
