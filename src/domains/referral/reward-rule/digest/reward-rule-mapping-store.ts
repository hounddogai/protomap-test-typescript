import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleMapping } from "./reward-rule-mapping.js";

/** Keeps reward rule mappings by code. */
export interface RewardRuleMappingStore {
  find(code: string): RewardRuleMapping | undefined;
  save(item: RewardRuleMapping): void;
  remove(code: string): boolean;
  list(): RewardRuleMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleMappingStore implements RewardRuleMappingStore {
  items: Map<string, RewardRuleMapping>;
  order: string[];

  constructor(items: Map<string, RewardRuleMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleMapping): void {
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

  list(): RewardRuleMapping[] {
    const out: RewardRuleMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleMappingStore(): RewardRuleMappingStore {
  return new MemoryRewardRuleMappingStore(new Map<string, RewardRuleMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleMappingStore implements RewardRuleMappingStore {
  inner: RewardRuleMappingStore;
  cache: cache.TtlCache<RewardRuleMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleMappingStore,
    cacheValue: cache.TtlCache<RewardRuleMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleMapping | undefined {
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

  save(item: RewardRuleMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleMapping[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleMappingStore(inner: RewardRuleMappingStore, ttl: number, clockValue: clock.Clock): RewardRuleMappingStore {
  return new CachedRewardRuleMappingStore(inner, cache.newTtlCache<RewardRuleMapping>(64, ttl, clockValue), 0, 0);
}

/** Selects reward rule mappings. Empty fields match all. */
export class RewardRuleMappingQuery {
  category: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minStartsAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleMapping): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleMapping[]): RewardRuleMapping[] {
    const matched = collections.filter(items, (candidate: RewardRuleMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleMappings(store: RewardRuleMappingStore, query: RewardRuleMappingQuery): RewardRuleMapping[] {
  return query.apply(store.list());
}
