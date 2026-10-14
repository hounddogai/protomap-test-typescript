import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRule } from "./reward-rule.js";

/** Keeps reward rules by code. */
export interface RewardRuleStore {
  find(code: string): RewardRule | undefined;
  save(item: RewardRule): void;
  remove(code: string): boolean;
  list(): RewardRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleStore implements RewardRuleStore {
  items: Map<string, RewardRule>;
  order: string[];

  constructor(items: Map<string, RewardRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRule): void {
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

  list(): RewardRule[] {
    const out: RewardRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleStore(): RewardRuleStore {
  return new MemoryRewardRuleStore(new Map<string, RewardRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleStore implements RewardRuleStore {
  inner: RewardRuleStore;
  cache: cache.TtlCache<RewardRule>;
  hits: number;
  misses: number;

  constructor(inner: RewardRuleStore, cacheValue: cache.TtlCache<RewardRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRule | undefined {
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

  save(item: RewardRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRule[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleStore(inner: RewardRuleStore, ttl: number, clockValue: clock.Clock): RewardRuleStore {
  return new CachedRewardRuleStore(inner, cache.newTtlCache<RewardRule>(256, ttl, clockValue), 0, 0);
}

/** Selects reward rules. Empty fields match all. */
export class RewardRuleQuery {
  unit: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minVersion: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRule): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRule[]): RewardRule[] {
    const matched = collections.filter(items, (candidate: RewardRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRules(store: RewardRuleStore, query: RewardRuleQuery): RewardRule[] {
  return query.apply(store.list());
}
