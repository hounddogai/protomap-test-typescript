import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingBidRuleNotice } from "./pending-bid-rule-notice.js";

/** Keeps pending bid rule notices by code. */
export interface PendingBidRuleNoticeStore {
  find(code: string): PendingBidRuleNotice | undefined;
  save(item: PendingBidRuleNotice): void;
  remove(code: string): boolean;
  list(): PendingBidRuleNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingBidRuleNoticeStore implements PendingBidRuleNoticeStore {
  items: Map<string, PendingBidRuleNotice>;
  order: string[];

  constructor(items: Map<string, PendingBidRuleNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingBidRuleNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingBidRuleNotice): void {
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

  list(): PendingBidRuleNotice[] {
    const out: PendingBidRuleNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingBidRuleNoticeStore(): PendingBidRuleNoticeStore {
  return new MemoryPendingBidRuleNoticeStore(new Map<string, PendingBidRuleNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingBidRuleNoticeStore implements PendingBidRuleNoticeStore {
  inner: PendingBidRuleNoticeStore;
  cache: cache.TtlCache<PendingBidRuleNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingBidRuleNoticeStore,
    cacheValue: cache.TtlCache<PendingBidRuleNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingBidRuleNotice | undefined {
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

  save(item: PendingBidRuleNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingBidRuleNotice[] {
    return this.inner.list();
  }
}

export function newCachedPendingBidRuleNoticeStore(inner: PendingBidRuleNoticeStore, ttl: number, clockValue: clock.Clock): PendingBidRuleNoticeStore {
  return new CachedPendingBidRuleNoticeStore(inner, cache.newTtlCache<PendingBidRuleNotice>(64, ttl, clockValue), 0, 0);
}

/** Selects pending bid rule notices. Empty fields match all. */
export class PendingBidRuleNoticeQuery {
  channel: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minQuantity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingBidRuleNotice): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingBidRuleNotice[]): PendingBidRuleNotice[] {
    const matched = collections.filter(items, (candidate: PendingBidRuleNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingBidRuleNotices(store: PendingBidRuleNoticeStore, query: PendingBidRuleNoticeQuery): PendingBidRuleNotice[] {
  return query.apply(store.list());
}
