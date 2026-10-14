import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedBidRuleException } from "./weighted-bid-rule-exception.js";

/** Keeps weighted bid rule exceptions by code. */
export interface WeightedBidRuleExceptionStore {
  find(code: string): WeightedBidRuleException | undefined;
  save(item: WeightedBidRuleException): void;
  remove(code: string): boolean;
  list(): WeightedBidRuleException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedBidRuleExceptionStore implements WeightedBidRuleExceptionStore {
  items: Map<string, WeightedBidRuleException>;
  order: string[];

  constructor(items: Map<string, WeightedBidRuleException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedBidRuleException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedBidRuleException): void {
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

  list(): WeightedBidRuleException[] {
    const out: WeightedBidRuleException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedBidRuleExceptionStore(): WeightedBidRuleExceptionStore {
  return new MemoryWeightedBidRuleExceptionStore(new Map<string, WeightedBidRuleException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedBidRuleExceptionStore implements WeightedBidRuleExceptionStore {
  inner: WeightedBidRuleExceptionStore;
  cache: cache.TtlCache<WeightedBidRuleException>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedBidRuleExceptionStore,
    cacheValue: cache.TtlCache<WeightedBidRuleException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedBidRuleException | undefined {
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

  save(item: WeightedBidRuleException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedBidRuleException[] {
    return this.inner.list();
  }
}

export function newCachedWeightedBidRuleExceptionStore(inner: WeightedBidRuleExceptionStore, ttl: number, clockValue: clock.Clock): WeightedBidRuleExceptionStore {
  return new CachedWeightedBidRuleExceptionStore(
    inner,
    cache.newTtlCache<WeightedBidRuleException>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted bid rule exceptions. Empty fields match all. */
export class WeightedBidRuleExceptionQuery {
  source: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minSendAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedBidRuleException): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedBidRuleException[]): WeightedBidRuleException[] {
    const matched = collections.filter(items, (candidate: WeightedBidRuleException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedBidRuleExceptions(store: WeightedBidRuleExceptionStore, query: WeightedBidRuleExceptionQuery): WeightedBidRuleException[] {
  return query.apply(store.list());
}
