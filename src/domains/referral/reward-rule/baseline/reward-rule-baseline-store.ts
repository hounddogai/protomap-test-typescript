import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleBaseline } from "./reward-rule-baseline.js";

/** Keeps reward rule baselines by code. */
export interface RewardRuleBaselineStore {
  find(code: string): RewardRuleBaseline | undefined;
  save(item: RewardRuleBaseline): void;
  remove(code: string): boolean;
  list(): RewardRuleBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleBaselineStore implements RewardRuleBaselineStore {
  items: Map<string, RewardRuleBaseline>;
  order: string[];

  constructor(items: Map<string, RewardRuleBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleBaseline): void {
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

  list(): RewardRuleBaseline[] {
    const out: RewardRuleBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleBaselineStore(): RewardRuleBaselineStore {
  return new MemoryRewardRuleBaselineStore(new Map<string, RewardRuleBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleBaselineStore implements RewardRuleBaselineStore {
  inner: RewardRuleBaselineStore;
  cache: cache.TtlCache<RewardRuleBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleBaselineStore,
    cacheValue: cache.TtlCache<RewardRuleBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleBaseline | undefined {
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

  save(item: RewardRuleBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleBaseline[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleBaselineStore(inner: RewardRuleBaselineStore, ttl: number, clockValue: clock.Clock): RewardRuleBaselineStore {
  return new CachedRewardRuleBaselineStore(inner, cache.newTtlCache<RewardRuleBaseline>(1024, ttl, clockValue), 0, 0);
}

/** Selects reward rule baselines. Empty fields match all. */
export class RewardRuleBaselineQuery {
  name: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minEndsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleBaseline[]): RewardRuleBaseline[] {
    const matched = collections.filter(items, (candidate: RewardRuleBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleBaselines(store: RewardRuleBaselineStore, query: RewardRuleBaselineQuery): RewardRuleBaseline[] {
  return query.apply(store.list());
}
