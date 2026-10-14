import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyBidRuleThreshold } from "./legacy-bid-rule-threshold.js";

/** Keeps legacy bid rule thresholds by code. */
export interface LegacyBidRuleThresholdStore {
  find(code: string): LegacyBidRuleThreshold | undefined;
  save(item: LegacyBidRuleThreshold): void;
  remove(code: string): boolean;
  list(): LegacyBidRuleThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyBidRuleThresholdStore implements LegacyBidRuleThresholdStore {
  items: Map<string, LegacyBidRuleThreshold>;
  order: string[];

  constructor(items: Map<string, LegacyBidRuleThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyBidRuleThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyBidRuleThreshold): void {
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

  list(): LegacyBidRuleThreshold[] {
    const out: LegacyBidRuleThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyBidRuleThresholdStore(): LegacyBidRuleThresholdStore {
  return new MemoryLegacyBidRuleThresholdStore(new Map<string, LegacyBidRuleThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyBidRuleThresholdStore implements LegacyBidRuleThresholdStore {
  inner: LegacyBidRuleThresholdStore;
  cache: cache.TtlCache<LegacyBidRuleThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyBidRuleThresholdStore,
    cacheValue: cache.TtlCache<LegacyBidRuleThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyBidRuleThreshold | undefined {
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

  save(item: LegacyBidRuleThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyBidRuleThreshold[] {
    return this.inner.list();
  }
}

export function newCachedLegacyBidRuleThresholdStore(inner: LegacyBidRuleThresholdStore, ttl: number, clockValue: clock.Clock): LegacyBidRuleThresholdStore {
  return new CachedLegacyBidRuleThresholdStore(
    inner,
    cache.newTtlCache<LegacyBidRuleThreshold>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy bid rule thresholds. Empty fields match all. */
export class LegacyBidRuleThresholdQuery {
  country: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minStartsAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyBidRuleThreshold): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyBidRuleThreshold[]): LegacyBidRuleThreshold[] {
    const matched = collections.filter(items, (candidate: LegacyBidRuleThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyBidRuleThresholds(store: LegacyBidRuleThresholdStore, query: LegacyBidRuleThresholdQuery): LegacyBidRuleThreshold[] {
  return query.apply(store.list());
}
