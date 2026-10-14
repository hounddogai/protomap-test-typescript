import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveExitRuleBundle } from "./adaptive-exit-rule-bundle.js";

/** Keeps adaptive exit rule bundles by code. */
export interface AdaptiveExitRuleBundleStore {
  find(code: string): AdaptiveExitRuleBundle | undefined;
  save(item: AdaptiveExitRuleBundle): void;
  remove(code: string): boolean;
  list(): AdaptiveExitRuleBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveExitRuleBundleStore implements AdaptiveExitRuleBundleStore {
  items: Map<string, AdaptiveExitRuleBundle>;
  order: string[];

  constructor(items: Map<string, AdaptiveExitRuleBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveExitRuleBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveExitRuleBundle): void {
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

  list(): AdaptiveExitRuleBundle[] {
    const out: AdaptiveExitRuleBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveExitRuleBundleStore(): AdaptiveExitRuleBundleStore {
  return new MemoryAdaptiveExitRuleBundleStore(new Map<string, AdaptiveExitRuleBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveExitRuleBundleStore implements AdaptiveExitRuleBundleStore {
  inner: AdaptiveExitRuleBundleStore;
  cache: cache.TtlCache<AdaptiveExitRuleBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveExitRuleBundleStore,
    cacheValue: cache.TtlCache<AdaptiveExitRuleBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveExitRuleBundle | undefined {
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

  save(item: AdaptiveExitRuleBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveExitRuleBundle[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveExitRuleBundleStore(inner: AdaptiveExitRuleBundleStore, ttl: number, clockValue: clock.Clock): AdaptiveExitRuleBundleStore {
  return new CachedAdaptiveExitRuleBundleStore(
    inner,
    cache.newTtlCache<AdaptiveExitRuleBundle>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive exit rule bundles. Empty fields match all. */
export class AdaptiveExitRuleBundleQuery {
  name: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAttempts: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveExitRuleBundle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveExitRuleBundle[]): AdaptiveExitRuleBundle[] {
    const matched = collections.filter(items, (candidate: AdaptiveExitRuleBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveExitRuleBundles(store: AdaptiveExitRuleBundleStore, query: AdaptiveExitRuleBundleQuery): AdaptiveExitRuleBundle[] {
  return query.apply(store.list());
}
