import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveBounceNotice } from "./adaptive-bounce-notice.js";

/** Keeps adaptive bounce notices by code. */
export interface AdaptiveBounceNoticeStore {
  find(code: string): AdaptiveBounceNotice | undefined;
  save(item: AdaptiveBounceNotice): void;
  remove(code: string): boolean;
  list(): AdaptiveBounceNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveBounceNoticeStore implements AdaptiveBounceNoticeStore {
  items: Map<string, AdaptiveBounceNotice>;
  order: string[];

  constructor(items: Map<string, AdaptiveBounceNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveBounceNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveBounceNotice): void {
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

  list(): AdaptiveBounceNotice[] {
    const out: AdaptiveBounceNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveBounceNoticeStore(): AdaptiveBounceNoticeStore {
  return new MemoryAdaptiveBounceNoticeStore(new Map<string, AdaptiveBounceNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveBounceNoticeStore implements AdaptiveBounceNoticeStore {
  inner: AdaptiveBounceNoticeStore;
  cache: cache.TtlCache<AdaptiveBounceNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveBounceNoticeStore,
    cacheValue: cache.TtlCache<AdaptiveBounceNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveBounceNotice | undefined {
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

  save(item: AdaptiveBounceNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveBounceNotice[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveBounceNoticeStore(inner: AdaptiveBounceNoticeStore, ttl: number, clockValue: clock.Clock): AdaptiveBounceNoticeStore {
  return new CachedAdaptiveBounceNoticeStore(
    inner,
    cache.newTtlCache<AdaptiveBounceNotice>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive bounce notices. Empty fields match all. */
export class AdaptiveBounceNoticeQuery {
  locale: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBid: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveBounceNotice): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveBounceNotice[]): AdaptiveBounceNotice[] {
    const matched = collections.filter(items, (candidate: AdaptiveBounceNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveBounceNotices(store: AdaptiveBounceNoticeStore, query: AdaptiveBounceNoticeQuery): AdaptiveBounceNotice[] {
  return query.apply(store.list());
}
