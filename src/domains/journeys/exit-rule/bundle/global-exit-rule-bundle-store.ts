import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalExitRuleBundle } from "./global-exit-rule-bundle.js";

/** Keeps global exit rule bundles by code. */
export interface GlobalExitRuleBundleStore {
  find(code: string): GlobalExitRuleBundle | undefined;
  save(item: GlobalExitRuleBundle): void;
  remove(code: string): boolean;
  list(): GlobalExitRuleBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalExitRuleBundleStore implements GlobalExitRuleBundleStore {
  items: Map<string, GlobalExitRuleBundle>;
  order: string[];

  constructor(items: Map<string, GlobalExitRuleBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalExitRuleBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalExitRuleBundle): void {
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

  list(): GlobalExitRuleBundle[] {
    const out: GlobalExitRuleBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalExitRuleBundleStore(): GlobalExitRuleBundleStore {
  return new MemoryGlobalExitRuleBundleStore(new Map<string, GlobalExitRuleBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalExitRuleBundleStore implements GlobalExitRuleBundleStore {
  inner: GlobalExitRuleBundleStore;
  cache: cache.TtlCache<GlobalExitRuleBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalExitRuleBundleStore,
    cacheValue: cache.TtlCache<GlobalExitRuleBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalExitRuleBundle | undefined {
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

  save(item: GlobalExitRuleBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalExitRuleBundle[] {
    return this.inner.list();
  }
}

export function newCachedGlobalExitRuleBundleStore(inner: GlobalExitRuleBundleStore, ttl: number, clockValue: clock.Clock): GlobalExitRuleBundleStore {
  return new CachedGlobalExitRuleBundleStore(
    inner,
    cache.newTtlCache<GlobalExitRuleBundle>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global exit rule bundles. Empty fields match all. */
export class GlobalExitRuleBundleQuery {
  source: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCost: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalExitRuleBundle): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalExitRuleBundle[]): GlobalExitRuleBundle[] {
    const matched = collections.filter(items, (candidate: GlobalExitRuleBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalExitRuleBundles(store: GlobalExitRuleBundleStore, query: GlobalExitRuleBundleQuery): GlobalExitRuleBundle[] {
  return query.apply(store.list());
}
