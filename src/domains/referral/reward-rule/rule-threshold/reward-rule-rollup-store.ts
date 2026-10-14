import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleRollup } from "./reward-rule-rollup.js";

/** Keeps reward rule rollups by code. */
export interface RewardRuleRollupStore {
  find(code: string): RewardRuleRollup | undefined;
  save(item: RewardRuleRollup): void;
  remove(code: string): boolean;
  list(): RewardRuleRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleRollupStore implements RewardRuleRollupStore {
  items: Map<string, RewardRuleRollup>;
  order: string[];

  constructor(items: Map<string, RewardRuleRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleRollup): void {
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

  list(): RewardRuleRollup[] {
    const out: RewardRuleRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleRollupStore(): RewardRuleRollupStore {
  return new MemoryRewardRuleRollupStore(new Map<string, RewardRuleRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleRollupStore implements RewardRuleRollupStore {
  inner: RewardRuleRollupStore;
  cache: cache.TtlCache<RewardRuleRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleRollupStore,
    cacheValue: cache.TtlCache<RewardRuleRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleRollup | undefined {
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

  save(item: RewardRuleRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleRollup[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleRollupStore(inner: RewardRuleRollupStore, ttl: number, clockValue: clock.Clock): RewardRuleRollupStore {
  return new CachedRewardRuleRollupStore(inner, cache.newTtlCache<RewardRuleRollup>(512, ttl, clockValue), 0, 0);
}

/** Selects reward rule rollups. Empty fields match all. */
export class RewardRuleRollupQuery {
  title: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSequence: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleRollup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleRollup[]): RewardRuleRollup[] {
    const matched = collections.filter(items, (candidate: RewardRuleRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleRollups(store: RewardRuleRollupStore, query: RewardRuleRollupQuery): RewardRuleRollup[] {
  return query.apply(store.list());
}
