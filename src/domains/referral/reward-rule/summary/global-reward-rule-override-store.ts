import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalRewardRuleOverride } from "./global-reward-rule-override.js";

/** Keeps global reward rule overrides by code. */
export interface GlobalRewardRuleOverrideStore {
  find(code: string): GlobalRewardRuleOverride | undefined;
  save(item: GlobalRewardRuleOverride): void;
  remove(code: string): boolean;
  list(): GlobalRewardRuleOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalRewardRuleOverrideStore implements GlobalRewardRuleOverrideStore {
  items: Map<string, GlobalRewardRuleOverride>;
  order: string[];

  constructor(items: Map<string, GlobalRewardRuleOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalRewardRuleOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalRewardRuleOverride): void {
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

  list(): GlobalRewardRuleOverride[] {
    const out: GlobalRewardRuleOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalRewardRuleOverrideStore(): GlobalRewardRuleOverrideStore {
  return new MemoryGlobalRewardRuleOverrideStore(new Map<string, GlobalRewardRuleOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalRewardRuleOverrideStore implements GlobalRewardRuleOverrideStore {
  inner: GlobalRewardRuleOverrideStore;
  cache: cache.TtlCache<GlobalRewardRuleOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalRewardRuleOverrideStore,
    cacheValue: cache.TtlCache<GlobalRewardRuleOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalRewardRuleOverride | undefined {
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

  save(item: GlobalRewardRuleOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalRewardRuleOverride[] {
    return this.inner.list();
  }
}

export function newCachedGlobalRewardRuleOverrideStore(inner: GlobalRewardRuleOverrideStore, ttl: number, clockValue: clock.Clock): GlobalRewardRuleOverrideStore {
  return new CachedGlobalRewardRuleOverrideStore(
    inner,
    cache.newTtlCache<GlobalRewardRuleOverride>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global reward rule overrides. Empty fields match all. */
export class GlobalRewardRuleOverrideQuery {
  name: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDiscount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalRewardRuleOverride): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalRewardRuleOverride[]): GlobalRewardRuleOverride[] {
    const matched = collections.filter(items, (candidate: GlobalRewardRuleOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalRewardRuleOverrides(store: GlobalRewardRuleOverrideStore, query: GlobalRewardRuleOverrideQuery): GlobalRewardRuleOverride[] {
  return query.apply(store.list());
}
