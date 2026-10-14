import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierRule } from "./tier-rule.js";

/** Keeps tier rules by code. */
export interface TierRuleStore {
  find(code: string): TierRule | undefined;
  save(item: TierRule): void;
  remove(code: string): boolean;
  list(): TierRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierRuleStore implements TierRuleStore {
  items: Map<string, TierRule>;
  order: string[];

  constructor(items: Map<string, TierRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierRule): void {
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

  list(): TierRule[] {
    const out: TierRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierRuleStore(): TierRuleStore {
  return new MemoryTierRuleStore(new Map<string, TierRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierRuleStore implements TierRuleStore {
  inner: TierRuleStore;
  cache: cache.TtlCache<TierRule>;
  hits: number;
  misses: number;

  constructor(inner: TierRuleStore, cacheValue: cache.TtlCache<TierRule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierRule | undefined {
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

  save(item: TierRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierRule[] {
    return this.inner.list();
  }
}

export function newCachedTierRuleStore(inner: TierRuleStore, ttl: number, clockValue: clock.Clock): TierRuleStore {
  return new CachedTierRuleStore(inner, cache.newTtlCache<TierRule>(1024, ttl, clockValue), 0, 0);
}

/** Selects tier rules. Empty fields match all. */
export class TierRuleQuery {
  channel: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierRule): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierRule[]): TierRule[] {
    const matched = collections.filter(items, (candidate: TierRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierRules(store: TierRuleStore, query: TierRuleQuery): TierRule[] {
  return query.apply(store.list());
}
