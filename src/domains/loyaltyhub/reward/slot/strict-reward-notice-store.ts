import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictRewardNotice } from "./strict-reward-notice.js";

/** Keeps strict reward notices by code. */
export interface StrictRewardNoticeStore {
  find(code: string): StrictRewardNotice | undefined;
  save(item: StrictRewardNotice): void;
  remove(code: string): boolean;
  list(): StrictRewardNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictRewardNoticeStore implements StrictRewardNoticeStore {
  items: Map<string, StrictRewardNotice>;
  order: string[];

  constructor(items: Map<string, StrictRewardNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictRewardNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictRewardNotice): void {
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

  list(): StrictRewardNotice[] {
    const out: StrictRewardNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictRewardNoticeStore(): StrictRewardNoticeStore {
  return new MemoryStrictRewardNoticeStore(new Map<string, StrictRewardNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictRewardNoticeStore implements StrictRewardNoticeStore {
  inner: StrictRewardNoticeStore;
  cache: cache.TtlCache<StrictRewardNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictRewardNoticeStore,
    cacheValue: cache.TtlCache<StrictRewardNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictRewardNotice | undefined {
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

  save(item: StrictRewardNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictRewardNotice[] {
    return this.inner.list();
  }
}

export function newCachedStrictRewardNoticeStore(inner: StrictRewardNoticeStore, ttl: number, clockValue: clock.Clock): StrictRewardNoticeStore {
  return new CachedStrictRewardNoticeStore(inner, cache.newTtlCache<StrictRewardNotice>(1024, ttl, clockValue), 0, 0);
}

/** Selects strict reward notices. Empty fields match all. */
export class StrictRewardNoticeQuery {
  segment: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRate: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictRewardNotice): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictRewardNotice[]): StrictRewardNotice[] {
    const matched = collections.filter(items, (candidate: StrictRewardNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictRewardNotices(store: StrictRewardNoticeStore, query: StrictRewardNoticeQuery): StrictRewardNotice[] {
  return query.apply(store.list());
}
