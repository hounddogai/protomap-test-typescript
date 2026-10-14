import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleTarget } from "./bid-rule-target.js";

/** Keeps bid rule targets by code. */
export interface BidRuleTargetStore {
  find(code: string): BidRuleTarget | undefined;
  save(item: BidRuleTarget): void;
  remove(code: string): boolean;
  list(): BidRuleTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleTargetStore implements BidRuleTargetStore {
  items: Map<string, BidRuleTarget>;
  order: string[];

  constructor(items: Map<string, BidRuleTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleTarget): void {
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

  list(): BidRuleTarget[] {
    const out: BidRuleTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleTargetStore(): BidRuleTargetStore {
  return new MemoryBidRuleTargetStore(new Map<string, BidRuleTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleTargetStore implements BidRuleTargetStore {
  inner: BidRuleTargetStore;
  cache: cache.TtlCache<BidRuleTarget>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleTargetStore, cacheValue: cache.TtlCache<BidRuleTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleTarget | undefined {
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

  save(item: BidRuleTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleTarget[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleTargetStore(inner: BidRuleTargetStore, ttl: number, clockValue: clock.Clock): BidRuleTargetStore {
  return new CachedBidRuleTargetStore(inner, cache.newTtlCache<BidRuleTarget>(512, ttl, clockValue), 0, 0);
}

/** Selects bid rule targets. Empty fields match all. */
export class BidRuleTargetQuery {
  title: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRevision: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleTarget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleTarget[]): BidRuleTarget[] {
    const matched = collections.filter(items, (candidate: BidRuleTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleTargets(store: BidRuleTargetStore, query: BidRuleTargetQuery): BidRuleTarget[] {
  return query.apply(store.list());
}
