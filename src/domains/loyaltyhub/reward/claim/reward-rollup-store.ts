import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRollup } from "./reward-rollup.js";

/** Keeps reward rollups by code. */
export interface RewardRollupStore {
  find(code: string): RewardRollup | undefined;
  save(item: RewardRollup): void;
  remove(code: string): boolean;
  list(): RewardRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRollupStore implements RewardRollupStore {
  items: Map<string, RewardRollup>;
  order: string[];

  constructor(items: Map<string, RewardRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRollup): void {
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

  list(): RewardRollup[] {
    const out: RewardRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRollupStore(): RewardRollupStore {
  return new MemoryRewardRollupStore(new Map<string, RewardRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRollupStore implements RewardRollupStore {
  inner: RewardRollupStore;
  cache: cache.TtlCache<RewardRollup>;
  hits: number;
  misses: number;

  constructor(inner: RewardRollupStore, cacheValue: cache.TtlCache<RewardRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRollup | undefined {
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

  save(item: RewardRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRollup[] {
    return this.inner.list();
  }
}

export function newCachedRewardRollupStore(inner: RewardRollupStore, ttl: number, clockValue: clock.Clock): RewardRollupStore {
  return new CachedRewardRollupStore(inner, cache.newTtlCache<RewardRollup>(64, ttl, clockValue), 0, 0);
}

/** Selects reward rollups. Empty fields match all. */
export class RewardRollupQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRollup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRollup[]): RewardRollup[] {
    const matched = collections.filter(items, (candidate: RewardRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRollups(store: RewardRollupStore, query: RewardRollupQuery): RewardRollup[] {
  return query.apply(store.list());
}
