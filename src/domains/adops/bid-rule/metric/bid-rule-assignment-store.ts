import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleAssignment } from "./bid-rule-assignment.js";

/** Keeps bid rule assignments by code. */
export interface BidRuleAssignmentStore {
  find(code: string): BidRuleAssignment | undefined;
  save(item: BidRuleAssignment): void;
  remove(code: string): boolean;
  list(): BidRuleAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleAssignmentStore implements BidRuleAssignmentStore {
  items: Map<string, BidRuleAssignment>;
  order: string[];

  constructor(items: Map<string, BidRuleAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleAssignment): void {
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

  list(): BidRuleAssignment[] {
    const out: BidRuleAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleAssignmentStore(): BidRuleAssignmentStore {
  return new MemoryBidRuleAssignmentStore(new Map<string, BidRuleAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleAssignmentStore implements BidRuleAssignmentStore {
  inner: BidRuleAssignmentStore;
  cache: cache.TtlCache<BidRuleAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleAssignmentStore,
    cacheValue: cache.TtlCache<BidRuleAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleAssignment | undefined {
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

  save(item: BidRuleAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleAssignment[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleAssignmentStore(inner: BidRuleAssignmentStore, ttl: number, clockValue: clock.Clock): BidRuleAssignmentStore {
  return new CachedBidRuleAssignmentStore(inner, cache.newTtlCache<BidRuleAssignment>(512, ttl, clockValue), 0, 0);
}

/** Selects bid rule assignments. Empty fields match all. */
export class BidRuleAssignmentQuery {
  country: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minQuantity: number, statuses: string[], limit: number) {
    this.country = country;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleAssignment): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleAssignment[]): BidRuleAssignment[] {
    const matched = collections.filter(items, (candidate: BidRuleAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleAssignments(store: BidRuleAssignmentStore, query: BidRuleAssignmentQuery): BidRuleAssignment[] {
  return query.apply(store.list());
}
