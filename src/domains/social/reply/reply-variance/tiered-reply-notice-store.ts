import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredReplyNotice } from "./tiered-reply-notice.js";

/** Keeps tiered reply notices by code. */
export interface TieredReplyNoticeStore {
  find(code: string): TieredReplyNotice | undefined;
  save(item: TieredReplyNotice): void;
  remove(code: string): boolean;
  list(): TieredReplyNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredReplyNoticeStore implements TieredReplyNoticeStore {
  items: Map<string, TieredReplyNotice>;
  order: string[];

  constructor(items: Map<string, TieredReplyNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredReplyNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredReplyNotice): void {
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

  list(): TieredReplyNotice[] {
    const out: TieredReplyNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredReplyNoticeStore(): TieredReplyNoticeStore {
  return new MemoryTieredReplyNoticeStore(new Map<string, TieredReplyNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredReplyNoticeStore implements TieredReplyNoticeStore {
  inner: TieredReplyNoticeStore;
  cache: cache.TtlCache<TieredReplyNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredReplyNoticeStore,
    cacheValue: cache.TtlCache<TieredReplyNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredReplyNotice | undefined {
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

  save(item: TieredReplyNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredReplyNotice[] {
    return this.inner.list();
  }
}

export function newCachedTieredReplyNoticeStore(inner: TieredReplyNoticeStore, ttl: number, clockValue: clock.Clock): TieredReplyNoticeStore {
  return new CachedTieredReplyNoticeStore(inner, cache.newTtlCache<TieredReplyNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects tiered reply notices. Empty fields match all. */
export class TieredReplyNoticeQuery {
  category: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minImpressions: number, statuses: string[], limit: number) {
    this.category = category;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredReplyNotice): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredReplyNotice[]): TieredReplyNotice[] {
    const matched = collections.filter(items, (candidate: TieredReplyNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredReplyNotices(store: TieredReplyNoticeStore, query: TieredReplyNoticeQuery): TieredReplyNotice[] {
  return query.apply(store.list());
}
