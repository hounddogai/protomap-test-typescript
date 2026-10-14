import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBranchNotice } from "./tiered-branch-notice.js";

/** Keeps tiered branch notices by code. */
export interface TieredBranchNoticeStore {
  find(code: string): TieredBranchNotice | undefined;
  save(item: TieredBranchNotice): void;
  remove(code: string): boolean;
  list(): TieredBranchNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBranchNoticeStore implements TieredBranchNoticeStore {
  items: Map<string, TieredBranchNotice>;
  order: string[];

  constructor(items: Map<string, TieredBranchNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBranchNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBranchNotice): void {
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

  list(): TieredBranchNotice[] {
    const out: TieredBranchNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBranchNoticeStore(): TieredBranchNoticeStore {
  return new MemoryTieredBranchNoticeStore(new Map<string, TieredBranchNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBranchNoticeStore implements TieredBranchNoticeStore {
  inner: TieredBranchNoticeStore;
  cache: cache.TtlCache<TieredBranchNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBranchNoticeStore,
    cacheValue: cache.TtlCache<TieredBranchNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBranchNotice | undefined {
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

  save(item: TieredBranchNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBranchNotice[] {
    return this.inner.list();
  }
}

export function newCachedTieredBranchNoticeStore(inner: TieredBranchNoticeStore, ttl: number, clockValue: clock.Clock): TieredBranchNoticeStore {
  return new CachedTieredBranchNoticeStore(inner, cache.newTtlCache<TieredBranchNotice>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered branch notices. Empty fields match all. */
export class TieredBranchNoticeQuery {
  segment: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minAmount: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBranchNotice): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBranchNotice[]): TieredBranchNotice[] {
    const matched = collections.filter(items, (candidate: TieredBranchNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBranchNotices(store: TieredBranchNoticeStore, query: TieredBranchNoticeQuery): TieredBranchNotice[] {
  return query.apply(store.list());
}
