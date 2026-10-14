import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedBidRuleOverride } from "./capped-bid-rule-override.js";

/** Keeps capped bid rule overrides by code. */
export interface CappedBidRuleOverrideStore {
  find(code: string): CappedBidRuleOverride | undefined;
  save(item: CappedBidRuleOverride): void;
  remove(code: string): boolean;
  list(): CappedBidRuleOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedBidRuleOverrideStore implements CappedBidRuleOverrideStore {
  items: Map<string, CappedBidRuleOverride>;
  order: string[];

  constructor(items: Map<string, CappedBidRuleOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedBidRuleOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedBidRuleOverride): void {
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

  list(): CappedBidRuleOverride[] {
    const out: CappedBidRuleOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedBidRuleOverrideStore(): CappedBidRuleOverrideStore {
  return new MemoryCappedBidRuleOverrideStore(new Map<string, CappedBidRuleOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedBidRuleOverrideStore implements CappedBidRuleOverrideStore {
  inner: CappedBidRuleOverrideStore;
  cache: cache.TtlCache<CappedBidRuleOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedBidRuleOverrideStore,
    cacheValue: cache.TtlCache<CappedBidRuleOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedBidRuleOverride | undefined {
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

  save(item: CappedBidRuleOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedBidRuleOverride[] {
    return this.inner.list();
  }
}

export function newCachedCappedBidRuleOverrideStore(inner: CappedBidRuleOverrideStore, ttl: number, clockValue: clock.Clock): CappedBidRuleOverrideStore {
  return new CachedCappedBidRuleOverrideStore(
    inner,
    cache.newTtlCache<CappedBidRuleOverride>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped bid rule overrides. Empty fields match all. */
export class CappedBidRuleOverrideQuery {
  name: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCapacity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedBidRuleOverride): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedBidRuleOverride[]): CappedBidRuleOverride[] {
    const matched = collections.filter(items, (candidate: CappedBidRuleOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedBidRuleOverrides(store: CappedBidRuleOverrideStore, query: CappedBidRuleOverrideQuery): CappedBidRuleOverride[] {
  return query.apply(store.list());
}
