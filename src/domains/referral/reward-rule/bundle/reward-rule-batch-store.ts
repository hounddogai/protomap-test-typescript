import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleBatch } from "./reward-rule-batch.js";

/** Keeps reward rule batches by code. */
export interface RewardRuleBatchStore {
  find(code: string): RewardRuleBatch | undefined;
  save(item: RewardRuleBatch): void;
  remove(code: string): boolean;
  list(): RewardRuleBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleBatchStore implements RewardRuleBatchStore {
  items: Map<string, RewardRuleBatch>;
  order: string[];

  constructor(items: Map<string, RewardRuleBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleBatch): void {
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

  list(): RewardRuleBatch[] {
    const out: RewardRuleBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleBatchStore(): RewardRuleBatchStore {
  return new MemoryRewardRuleBatchStore(new Map<string, RewardRuleBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleBatchStore implements RewardRuleBatchStore {
  inner: RewardRuleBatchStore;
  cache: cache.TtlCache<RewardRuleBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleBatchStore,
    cacheValue: cache.TtlCache<RewardRuleBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleBatch | undefined {
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

  save(item: RewardRuleBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleBatch[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleBatchStore(inner: RewardRuleBatchStore, ttl: number, clockValue: clock.Clock): RewardRuleBatchStore {
  return new CachedRewardRuleBatchStore(inner, cache.newTtlCache<RewardRuleBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects reward rule batches. Empty fields match all. */
export class RewardRuleBatchQuery {
  utmSource: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCeiling: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleBatch): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleBatch[]): RewardRuleBatch[] {
    const matched = collections.filter(items, (candidate: RewardRuleBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleBatches(store: RewardRuleBatchStore, query: RewardRuleBatchQuery): RewardRuleBatch[] {
  return query.apply(store.list());
}
