import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredFunnelRule } from "./tiered-funnel-rule.js";

/** Keeps tiered funnel rules by code. */
export interface TieredFunnelRuleStore {
  find(code: string): TieredFunnelRule | undefined;
  save(item: TieredFunnelRule): void;
  remove(code: string): boolean;
  list(): TieredFunnelRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredFunnelRuleStore implements TieredFunnelRuleStore {
  items: Map<string, TieredFunnelRule>;
  order: string[];

  constructor(items: Map<string, TieredFunnelRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredFunnelRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredFunnelRule): void {
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

  list(): TieredFunnelRule[] {
    const out: TieredFunnelRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredFunnelRuleStore(): TieredFunnelRuleStore {
  return new MemoryTieredFunnelRuleStore(new Map<string, TieredFunnelRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredFunnelRuleStore implements TieredFunnelRuleStore {
  inner: TieredFunnelRuleStore;
  cache: cache.TtlCache<TieredFunnelRule>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredFunnelRuleStore,
    cacheValue: cache.TtlCache<TieredFunnelRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredFunnelRule | undefined {
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

  save(item: TieredFunnelRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredFunnelRule[] {
    return this.inner.list();
  }
}

export function newCachedTieredFunnelRuleStore(inner: TieredFunnelRuleStore, ttl: number, clockValue: clock.Clock): TieredFunnelRuleStore {
  return new CachedTieredFunnelRuleStore(inner, cache.newTtlCache<TieredFunnelRule>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered funnel rules. Empty fields match all. */
export class TieredFunnelRuleQuery {
  source: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minMargin: number, statuses: string[], limit: number) {
    this.source = source;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredFunnelRule): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredFunnelRule[]): TieredFunnelRule[] {
    const matched = collections.filter(items, (candidate: TieredFunnelRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredFunnelRules(store: TieredFunnelRuleStore, query: TieredFunnelRuleQuery): TieredFunnelRule[] {
  return query.apply(store.list());
}
