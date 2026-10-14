import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleOverride } from "./bid-rule-override.js";

/** Keeps bid rule overrides by code. */
export interface BidRuleOverrideStore {
  find(code: string): BidRuleOverride | undefined;
  save(item: BidRuleOverride): void;
  remove(code: string): boolean;
  list(): BidRuleOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleOverrideStore implements BidRuleOverrideStore {
  items: Map<string, BidRuleOverride>;
  order: string[];

  constructor(items: Map<string, BidRuleOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleOverride): void {
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

  list(): BidRuleOverride[] {
    const out: BidRuleOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleOverrideStore(): BidRuleOverrideStore {
  return new MemoryBidRuleOverrideStore(new Map<string, BidRuleOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleOverrideStore implements BidRuleOverrideStore {
  inner: BidRuleOverrideStore;
  cache: cache.TtlCache<BidRuleOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleOverrideStore,
    cacheValue: cache.TtlCache<BidRuleOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleOverride | undefined {
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

  save(item: BidRuleOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleOverride[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleOverrideStore(inner: BidRuleOverrideStore, ttl: number, clockValue: clock.Clock): BidRuleOverrideStore {
  return new CachedBidRuleOverrideStore(inner, cache.newTtlCache<BidRuleOverride>(256, ttl, clockValue), 0, 0);
}

/** Selects bid rule overrides. Empty fields match all. */
export class BidRuleOverrideQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleOverride[]): BidRuleOverride[] {
    const matched = collections.filter(items, (candidate: BidRuleOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleOverrides(store: BidRuleOverrideStore, query: BidRuleOverrideQuery): BidRuleOverride[] {
  return query.apply(store.list());
}
