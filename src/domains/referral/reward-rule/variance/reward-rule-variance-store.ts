import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleVariance } from "./reward-rule-variance.js";

/** Keeps reward rule variances by code. */
export interface RewardRuleVarianceStore {
  find(code: string): RewardRuleVariance | undefined;
  save(item: RewardRuleVariance): void;
  remove(code: string): boolean;
  list(): RewardRuleVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleVarianceStore implements RewardRuleVarianceStore {
  items: Map<string, RewardRuleVariance>;
  order: string[];

  constructor(items: Map<string, RewardRuleVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleVariance): void {
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

  list(): RewardRuleVariance[] {
    const out: RewardRuleVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleVarianceStore(): RewardRuleVarianceStore {
  return new MemoryRewardRuleVarianceStore(new Map<string, RewardRuleVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleVarianceStore implements RewardRuleVarianceStore {
  inner: RewardRuleVarianceStore;
  cache: cache.TtlCache<RewardRuleVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleVarianceStore,
    cacheValue: cache.TtlCache<RewardRuleVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleVariance | undefined {
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

  save(item: RewardRuleVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleVariance[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleVarianceStore(inner: RewardRuleVarianceStore, ttl: number, clockValue: clock.Clock): RewardRuleVarianceStore {
  return new CachedRewardRuleVarianceStore(inner, cache.newTtlCache<RewardRuleVariance>(128, ttl, clockValue), 0, 0);
}

/** Selects reward rule variances. Empty fields match all. */
export class RewardRuleVarianceQuery {
  title: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRevision: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleVariance): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleVariance[]): RewardRuleVariance[] {
    const matched = collections.filter(items, (candidate: RewardRuleVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleVariances(store: RewardRuleVarianceStore, query: RewardRuleVarianceQuery): RewardRuleVariance[] {
  return query.apply(store.list());
}
