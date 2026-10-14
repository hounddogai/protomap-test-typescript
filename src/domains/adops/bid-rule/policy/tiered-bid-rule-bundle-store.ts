import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBidRuleBundle } from "./tiered-bid-rule-bundle.js";

/** Keeps tiered bid rule bundles by code. */
export interface TieredBidRuleBundleStore {
  find(code: string): TieredBidRuleBundle | undefined;
  save(item: TieredBidRuleBundle): void;
  remove(code: string): boolean;
  list(): TieredBidRuleBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBidRuleBundleStore implements TieredBidRuleBundleStore {
  items: Map<string, TieredBidRuleBundle>;
  order: string[];

  constructor(items: Map<string, TieredBidRuleBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBidRuleBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBidRuleBundle): void {
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

  list(): TieredBidRuleBundle[] {
    const out: TieredBidRuleBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBidRuleBundleStore(): TieredBidRuleBundleStore {
  return new MemoryTieredBidRuleBundleStore(new Map<string, TieredBidRuleBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBidRuleBundleStore implements TieredBidRuleBundleStore {
  inner: TieredBidRuleBundleStore;
  cache: cache.TtlCache<TieredBidRuleBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBidRuleBundleStore,
    cacheValue: cache.TtlCache<TieredBidRuleBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBidRuleBundle | undefined {
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

  save(item: TieredBidRuleBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBidRuleBundle[] {
    return this.inner.list();
  }
}

export function newCachedTieredBidRuleBundleStore(inner: TieredBidRuleBundleStore, ttl: number, clockValue: clock.Clock): TieredBidRuleBundleStore {
  return new CachedTieredBidRuleBundleStore(inner, cache.newTtlCache<TieredBidRuleBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered bid rule bundles. Empty fields match all. */
export class TieredBidRuleBundleQuery {
  locale: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minStartsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBidRuleBundle): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBidRuleBundle[]): TieredBidRuleBundle[] {
    const matched = collections.filter(items, (candidate: TieredBidRuleBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBidRuleBundles(store: TieredBidRuleBundleStore, query: TieredBidRuleBundleQuery): TieredBidRuleBundle[] {
  return query.apply(store.list());
}
