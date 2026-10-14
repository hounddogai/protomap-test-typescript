import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalRewardRule } from "./seasonal-reward-rule.js";

/** Keeps seasonal reward rules by code. */
export interface SeasonalRewardRuleStore {
  find(code: string): SeasonalRewardRule | undefined;
  save(item: SeasonalRewardRule): void;
  remove(code: string): boolean;
  list(): SeasonalRewardRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalRewardRuleStore implements SeasonalRewardRuleStore {
  items: Map<string, SeasonalRewardRule>;
  order: string[];

  constructor(items: Map<string, SeasonalRewardRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalRewardRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalRewardRule): void {
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

  list(): SeasonalRewardRule[] {
    const out: SeasonalRewardRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalRewardRuleStore(): SeasonalRewardRuleStore {
  return new MemorySeasonalRewardRuleStore(new Map<string, SeasonalRewardRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalRewardRuleStore implements SeasonalRewardRuleStore {
  inner: SeasonalRewardRuleStore;
  cache: cache.TtlCache<SeasonalRewardRule>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalRewardRuleStore,
    cacheValue: cache.TtlCache<SeasonalRewardRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalRewardRule | undefined {
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

  save(item: SeasonalRewardRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalRewardRule[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalRewardRuleStore(inner: SeasonalRewardRuleStore, ttl: number, clockValue: clock.Clock): SeasonalRewardRuleStore {
  return new CachedSeasonalRewardRuleStore(inner, cache.newTtlCache<SeasonalRewardRule>(256, ttl, clockValue), 0, 0);
}

/** Selects seasonal reward rules. Empty fields match all. */
export class SeasonalRewardRuleQuery {
  channel: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalRewardRule): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalRewardRule[]): SeasonalRewardRule[] {
    const matched = collections.filter(items, (candidate: SeasonalRewardRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalRewardRules(store: SeasonalRewardRuleStore, query: SeasonalRewardRuleQuery): SeasonalRewardRule[] {
  return query.apply(store.list());
}
