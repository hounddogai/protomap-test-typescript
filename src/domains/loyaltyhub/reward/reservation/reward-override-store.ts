import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardOverride } from "./reward-override.js";

/** Keeps reward overrides by code. */
export interface RewardOverrideStore {
  find(code: string): RewardOverride | undefined;
  save(item: RewardOverride): void;
  remove(code: string): boolean;
  list(): RewardOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardOverrideStore implements RewardOverrideStore {
  items: Map<string, RewardOverride>;
  order: string[];

  constructor(items: Map<string, RewardOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardOverride): void {
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

  list(): RewardOverride[] {
    const out: RewardOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardOverrideStore(): RewardOverrideStore {
  return new MemoryRewardOverrideStore(new Map<string, RewardOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardOverrideStore implements RewardOverrideStore {
  inner: RewardOverrideStore;
  cache: cache.TtlCache<RewardOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardOverrideStore,
    cacheValue: cache.TtlCache<RewardOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardOverride | undefined {
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

  save(item: RewardOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardOverride[] {
    return this.inner.list();
  }
}

export function newCachedRewardOverrideStore(inner: RewardOverrideStore, ttl: number, clockValue: clock.Clock): RewardOverrideStore {
  return new CachedRewardOverrideStore(inner, cache.newTtlCache<RewardOverride>(64, ttl, clockValue), 0, 0);
}

/** Selects reward overrides. Empty fields match all. */
export class RewardOverrideQuery {
  source: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardOverride): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardOverride[]): RewardOverride[] {
    const matched = collections.filter(items, (candidate: RewardOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardOverrides(store: RewardOverrideStore, query: RewardOverrideQuery): RewardOverride[] {
  return query.apply(store.list());
}
