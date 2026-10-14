import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualBidRuleBundle } from "./manual-bid-rule-bundle.js";

/** Keeps manual bid rule bundles by code. */
export interface ManualBidRuleBundleStore {
  find(code: string): ManualBidRuleBundle | undefined;
  save(item: ManualBidRuleBundle): void;
  remove(code: string): boolean;
  list(): ManualBidRuleBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualBidRuleBundleStore implements ManualBidRuleBundleStore {
  items: Map<string, ManualBidRuleBundle>;
  order: string[];

  constructor(items: Map<string, ManualBidRuleBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualBidRuleBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualBidRuleBundle): void {
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

  list(): ManualBidRuleBundle[] {
    const out: ManualBidRuleBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualBidRuleBundleStore(): ManualBidRuleBundleStore {
  return new MemoryManualBidRuleBundleStore(new Map<string, ManualBidRuleBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualBidRuleBundleStore implements ManualBidRuleBundleStore {
  inner: ManualBidRuleBundleStore;
  cache: cache.TtlCache<ManualBidRuleBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualBidRuleBundleStore,
    cacheValue: cache.TtlCache<ManualBidRuleBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualBidRuleBundle | undefined {
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

  save(item: ManualBidRuleBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualBidRuleBundle[] {
    return this.inner.list();
  }
}

export function newCachedManualBidRuleBundleStore(inner: ManualBidRuleBundleStore, ttl: number, clockValue: clock.Clock): ManualBidRuleBundleStore {
  return new CachedManualBidRuleBundleStore(inner, cache.newTtlCache<ManualBidRuleBundle>(128, ttl, clockValue), 0, 0);
}

/** Selects manual bid rule bundles. Empty fields match all. */
export class ManualBidRuleBundleQuery {
  title: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minStartsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualBidRuleBundle): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualBidRuleBundle[]): ManualBidRuleBundle[] {
    const matched = collections.filter(items, (candidate: ManualBidRuleBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualBidRuleBundles(store: ManualBidRuleBundleStore, query: ManualBidRuleBundleQuery): ManualBidRuleBundle[] {
  return query.apply(store.list());
}
