import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleException } from "./bid-rule-exception.js";

/** Keeps bid rule exceptions by code. */
export interface BidRuleExceptionStore {
  find(code: string): BidRuleException | undefined;
  save(item: BidRuleException): void;
  remove(code: string): boolean;
  list(): BidRuleException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleExceptionStore implements BidRuleExceptionStore {
  items: Map<string, BidRuleException>;
  order: string[];

  constructor(items: Map<string, BidRuleException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleException): void {
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

  list(): BidRuleException[] {
    const out: BidRuleException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleExceptionStore(): BidRuleExceptionStore {
  return new MemoryBidRuleExceptionStore(new Map<string, BidRuleException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleExceptionStore implements BidRuleExceptionStore {
  inner: BidRuleExceptionStore;
  cache: cache.TtlCache<BidRuleException>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleExceptionStore,
    cacheValue: cache.TtlCache<BidRuleException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleException | undefined {
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

  save(item: BidRuleException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleException[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleExceptionStore(inner: BidRuleExceptionStore, ttl: number, clockValue: clock.Clock): BidRuleExceptionStore {
  return new CachedBidRuleExceptionStore(inner, cache.newTtlCache<BidRuleException>(512, ttl, clockValue), 0, 0);
}

/** Selects bid rule exceptions. Empty fields match all. */
export class BidRuleExceptionQuery {
  label: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleException): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleException[]): BidRuleException[] {
    const matched = collections.filter(items, (candidate: BidRuleException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleExceptions(store: BidRuleExceptionStore, query: BidRuleExceptionQuery): BidRuleException[] {
  return query.apply(store.list());
}
