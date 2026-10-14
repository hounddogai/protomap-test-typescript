import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleRequest } from "./bid-rule-request.js";

/** Keeps bid rule requests by code. */
export interface BidRuleRequestStore {
  find(code: string): BidRuleRequest | undefined;
  save(item: BidRuleRequest): void;
  remove(code: string): boolean;
  list(): BidRuleRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleRequestStore implements BidRuleRequestStore {
  items: Map<string, BidRuleRequest>;
  order: string[];

  constructor(items: Map<string, BidRuleRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleRequest): void {
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

  list(): BidRuleRequest[] {
    const out: BidRuleRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleRequestStore(): BidRuleRequestStore {
  return new MemoryBidRuleRequestStore(new Map<string, BidRuleRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleRequestStore implements BidRuleRequestStore {
  inner: BidRuleRequestStore;
  cache: cache.TtlCache<BidRuleRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleRequestStore,
    cacheValue: cache.TtlCache<BidRuleRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleRequest | undefined {
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

  save(item: BidRuleRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleRequest[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleRequestStore(inner: BidRuleRequestStore, ttl: number, clockValue: clock.Clock): BidRuleRequestStore {
  return new CachedBidRuleRequestStore(inner, cache.newTtlCache<BidRuleRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects bid rule requests. Empty fields match all. */
export class BidRuleRequestQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleRequest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleRequest[]): BidRuleRequest[] {
    const matched = collections.filter(items, (candidate: BidRuleRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleRequests(store: BidRuleRequestStore, query: BidRuleRequestQuery): BidRuleRequest[] {
  return query.apply(store.list());
}
