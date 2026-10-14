import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleManifest } from "./bid-rule-manifest.js";

/** Keeps bid rule manifests by code. */
export interface BidRuleManifestStore {
  find(code: string): BidRuleManifest | undefined;
  save(item: BidRuleManifest): void;
  remove(code: string): boolean;
  list(): BidRuleManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleManifestStore implements BidRuleManifestStore {
  items: Map<string, BidRuleManifest>;
  order: string[];

  constructor(items: Map<string, BidRuleManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleManifest): void {
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

  list(): BidRuleManifest[] {
    const out: BidRuleManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleManifestStore(): BidRuleManifestStore {
  return new MemoryBidRuleManifestStore(new Map<string, BidRuleManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleManifestStore implements BidRuleManifestStore {
  inner: BidRuleManifestStore;
  cache: cache.TtlCache<BidRuleManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleManifestStore,
    cacheValue: cache.TtlCache<BidRuleManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleManifest | undefined {
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

  save(item: BidRuleManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleManifest[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleManifestStore(inner: BidRuleManifestStore, ttl: number, clockValue: clock.Clock): BidRuleManifestStore {
  return new CachedBidRuleManifestStore(inner, cache.newTtlCache<BidRuleManifest>(256, ttl, clockValue), 0, 0);
}

/** Selects bid rule manifests. Empty fields match all. */
export class BidRuleManifestQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleManifest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleManifest[]): BidRuleManifest[] {
    const matched = collections.filter(items, (candidate: BidRuleManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleManifests(store: BidRuleManifestStore, query: BidRuleManifestQuery): BidRuleManifest[] {
  return query.apply(store.list());
}
