import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackBidRuleOverride } from "./fallback-bid-rule-override.js";

/** Keeps fallback bid rule overrides by code. */
export interface FallbackBidRuleOverrideStore {
  find(code: string): FallbackBidRuleOverride | undefined;
  save(item: FallbackBidRuleOverride): void;
  remove(code: string): boolean;
  list(): FallbackBidRuleOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackBidRuleOverrideStore implements FallbackBidRuleOverrideStore {
  items: Map<string, FallbackBidRuleOverride>;
  order: string[];

  constructor(items: Map<string, FallbackBidRuleOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackBidRuleOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackBidRuleOverride): void {
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

  list(): FallbackBidRuleOverride[] {
    const out: FallbackBidRuleOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackBidRuleOverrideStore(): FallbackBidRuleOverrideStore {
  return new MemoryFallbackBidRuleOverrideStore(new Map<string, FallbackBidRuleOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackBidRuleOverrideStore implements FallbackBidRuleOverrideStore {
  inner: FallbackBidRuleOverrideStore;
  cache: cache.TtlCache<FallbackBidRuleOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackBidRuleOverrideStore,
    cacheValue: cache.TtlCache<FallbackBidRuleOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackBidRuleOverride | undefined {
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

  save(item: FallbackBidRuleOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackBidRuleOverride[] {
    return this.inner.list();
  }
}

export function newCachedFallbackBidRuleOverrideStore(inner: FallbackBidRuleOverrideStore, ttl: number, clockValue: clock.Clock): FallbackBidRuleOverrideStore {
  return new CachedFallbackBidRuleOverrideStore(
    inner,
    cache.newTtlCache<FallbackBidRuleOverride>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback bid rule overrides. Empty fields match all. */
export class FallbackBidRuleOverrideQuery {
  label: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackBidRuleOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackBidRuleOverride[]): FallbackBidRuleOverride[] {
    const matched = collections.filter(items, (candidate: FallbackBidRuleOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackBidRuleOverrides(store: FallbackBidRuleOverrideStore, query: FallbackBidRuleOverrideQuery): FallbackBidRuleOverride[] {
  return query.apply(store.list());
}
