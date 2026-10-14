import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleDigest } from "./bid-rule-digest.js";

/** Keeps bid rule digests by code. */
export interface BidRuleDigestStore {
  find(code: string): BidRuleDigest | undefined;
  save(item: BidRuleDigest): void;
  remove(code: string): boolean;
  list(): BidRuleDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleDigestStore implements BidRuleDigestStore {
  items: Map<string, BidRuleDigest>;
  order: string[];

  constructor(items: Map<string, BidRuleDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleDigest): void {
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

  list(): BidRuleDigest[] {
    const out: BidRuleDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleDigestStore(): BidRuleDigestStore {
  return new MemoryBidRuleDigestStore(new Map<string, BidRuleDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleDigestStore implements BidRuleDigestStore {
  inner: BidRuleDigestStore;
  cache: cache.TtlCache<BidRuleDigest>;
  hits: number;
  misses: number;

  constructor(inner: BidRuleDigestStore, cacheValue: cache.TtlCache<BidRuleDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleDigest | undefined {
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

  save(item: BidRuleDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleDigest[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleDigestStore(inner: BidRuleDigestStore, ttl: number, clockValue: clock.Clock): BidRuleDigestStore {
  return new CachedBidRuleDigestStore(inner, cache.newTtlCache<BidRuleDigest>(128, ttl, clockValue), 0, 0);
}

/** Selects bid rule digests. Empty fields match all. */
export class BidRuleDigestQuery {
  title: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minOpenRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleDigest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleDigest[]): BidRuleDigest[] {
    const matched = collections.filter(items, (candidate: BidRuleDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleDigests(store: BidRuleDigestStore, query: BidRuleDigestQuery): BidRuleDigest[] {
  return query.apply(store.list());
}
