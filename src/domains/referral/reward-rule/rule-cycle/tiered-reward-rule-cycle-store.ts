import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredRewardRuleCycle } from "./tiered-reward-rule-cycle.js";

/** Keeps tiered reward rule cycles by code. */
export interface TieredRewardRuleCycleStore {
  find(code: string): TieredRewardRuleCycle | undefined;
  save(item: TieredRewardRuleCycle): void;
  remove(code: string): boolean;
  list(): TieredRewardRuleCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredRewardRuleCycleStore implements TieredRewardRuleCycleStore {
  items: Map<string, TieredRewardRuleCycle>;
  order: string[];

  constructor(items: Map<string, TieredRewardRuleCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredRewardRuleCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredRewardRuleCycle): void {
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

  list(): TieredRewardRuleCycle[] {
    const out: TieredRewardRuleCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredRewardRuleCycleStore(): TieredRewardRuleCycleStore {
  return new MemoryTieredRewardRuleCycleStore(new Map<string, TieredRewardRuleCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredRewardRuleCycleStore implements TieredRewardRuleCycleStore {
  inner: TieredRewardRuleCycleStore;
  cache: cache.TtlCache<TieredRewardRuleCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredRewardRuleCycleStore,
    cacheValue: cache.TtlCache<TieredRewardRuleCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredRewardRuleCycle | undefined {
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

  save(item: TieredRewardRuleCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredRewardRuleCycle[] {
    return this.inner.list();
  }
}

export function newCachedTieredRewardRuleCycleStore(inner: TieredRewardRuleCycleStore, ttl: number, clockValue: clock.Clock): TieredRewardRuleCycleStore {
  return new CachedTieredRewardRuleCycleStore(
    inner,
    cache.newTtlCache<TieredRewardRuleCycle>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered reward rule cycles. Empty fields match all. */
export class TieredRewardRuleCycleQuery {
  name: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRatio: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredRewardRuleCycle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredRewardRuleCycle[]): TieredRewardRuleCycle[] {
    const matched = collections.filter(items, (candidate: TieredRewardRuleCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredRewardRuleCycles(store: TieredRewardRuleCycleStore, query: TieredRewardRuleCycleQuery): TieredRewardRuleCycle[] {
  return query.apply(store.list());
}
