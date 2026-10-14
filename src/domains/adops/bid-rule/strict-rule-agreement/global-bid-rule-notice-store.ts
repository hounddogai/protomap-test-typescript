import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalBidRuleNotice } from "./global-bid-rule-notice.js";

/** Keeps global bid rule notices by code. */
export interface GlobalBidRuleNoticeStore {
  find(code: string): GlobalBidRuleNotice | undefined;
  save(item: GlobalBidRuleNotice): void;
  remove(code: string): boolean;
  list(): GlobalBidRuleNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalBidRuleNoticeStore implements GlobalBidRuleNoticeStore {
  items: Map<string, GlobalBidRuleNotice>;
  order: string[];

  constructor(items: Map<string, GlobalBidRuleNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalBidRuleNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalBidRuleNotice): void {
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

  list(): GlobalBidRuleNotice[] {
    const out: GlobalBidRuleNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalBidRuleNoticeStore(): GlobalBidRuleNoticeStore {
  return new MemoryGlobalBidRuleNoticeStore(new Map<string, GlobalBidRuleNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalBidRuleNoticeStore implements GlobalBidRuleNoticeStore {
  inner: GlobalBidRuleNoticeStore;
  cache: cache.TtlCache<GlobalBidRuleNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalBidRuleNoticeStore,
    cacheValue: cache.TtlCache<GlobalBidRuleNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalBidRuleNotice | undefined {
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

  save(item: GlobalBidRuleNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalBidRuleNotice[] {
    return this.inner.list();
  }
}

export function newCachedGlobalBidRuleNoticeStore(inner: GlobalBidRuleNoticeStore, ttl: number, clockValue: clock.Clock): GlobalBidRuleNoticeStore {
  return new CachedGlobalBidRuleNoticeStore(inner, cache.newTtlCache<GlobalBidRuleNotice>(128, ttl, clockValue), 0, 0);
}

/** Selects global bid rule notices. Empty fields match all. */
export class GlobalBidRuleNoticeQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalBidRuleNotice): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalBidRuleNotice[]): GlobalBidRuleNotice[] {
    const matched = collections.filter(items, (candidate: GlobalBidRuleNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalBidRuleNotices(store: GlobalBidRuleNoticeStore, query: GlobalBidRuleNoticeQuery): GlobalBidRuleNotice[] {
  return query.apply(store.list());
}
