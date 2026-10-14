import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalRewardRuleBundle } from "./regional-reward-rule-bundle.js";

/** Keeps regional reward rule bundles by code. */
export interface RegionalRewardRuleBundleStore {
  find(code: string): RegionalRewardRuleBundle | undefined;
  save(item: RegionalRewardRuleBundle): void;
  remove(code: string): boolean;
  list(): RegionalRewardRuleBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalRewardRuleBundleStore implements RegionalRewardRuleBundleStore {
  items: Map<string, RegionalRewardRuleBundle>;
  order: string[];

  constructor(items: Map<string, RegionalRewardRuleBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalRewardRuleBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalRewardRuleBundle): void {
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

  list(): RegionalRewardRuleBundle[] {
    const out: RegionalRewardRuleBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalRewardRuleBundleStore(): RegionalRewardRuleBundleStore {
  return new MemoryRegionalRewardRuleBundleStore(new Map<string, RegionalRewardRuleBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalRewardRuleBundleStore implements RegionalRewardRuleBundleStore {
  inner: RegionalRewardRuleBundleStore;
  cache: cache.TtlCache<RegionalRewardRuleBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalRewardRuleBundleStore,
    cacheValue: cache.TtlCache<RegionalRewardRuleBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalRewardRuleBundle | undefined {
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

  save(item: RegionalRewardRuleBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalRewardRuleBundle[] {
    return this.inner.list();
  }
}

export function newCachedRegionalRewardRuleBundleStore(inner: RegionalRewardRuleBundleStore, ttl: number, clockValue: clock.Clock): RegionalRewardRuleBundleStore {
  return new CachedRegionalRewardRuleBundleStore(
    inner,
    cache.newTtlCache<RegionalRewardRuleBundle>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional reward rule bundles. Empty fields match all. */
export class RegionalRewardRuleBundleQuery {
  label: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRatio: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalRewardRuleBundle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalRewardRuleBundle[]): RegionalRewardRuleBundle[] {
    const matched = collections.filter(items, (candidate: RegionalRewardRuleBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalRewardRuleBundles(store: RegionalRewardRuleBundleStore, query: RegionalRewardRuleBundleQuery): RegionalRewardRuleBundle[] {
  return query.apply(store.list());
}
