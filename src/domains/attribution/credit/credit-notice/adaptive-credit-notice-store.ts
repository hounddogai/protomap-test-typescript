import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveCreditNotice } from "./adaptive-credit-notice.js";

/** Keeps adaptive credit notices by code. */
export interface AdaptiveCreditNoticeStore {
  find(code: string): AdaptiveCreditNotice | undefined;
  save(item: AdaptiveCreditNotice): void;
  remove(code: string): boolean;
  list(): AdaptiveCreditNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveCreditNoticeStore implements AdaptiveCreditNoticeStore {
  items: Map<string, AdaptiveCreditNotice>;
  order: string[];

  constructor(items: Map<string, AdaptiveCreditNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveCreditNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveCreditNotice): void {
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

  list(): AdaptiveCreditNotice[] {
    const out: AdaptiveCreditNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveCreditNoticeStore(): AdaptiveCreditNoticeStore {
  return new MemoryAdaptiveCreditNoticeStore(new Map<string, AdaptiveCreditNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveCreditNoticeStore implements AdaptiveCreditNoticeStore {
  inner: AdaptiveCreditNoticeStore;
  cache: cache.TtlCache<AdaptiveCreditNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveCreditNoticeStore,
    cacheValue: cache.TtlCache<AdaptiveCreditNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveCreditNotice | undefined {
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

  save(item: AdaptiveCreditNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveCreditNotice[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveCreditNoticeStore(inner: AdaptiveCreditNoticeStore, ttl: number, clockValue: clock.Clock): AdaptiveCreditNoticeStore {
  return new CachedAdaptiveCreditNoticeStore(
    inner,
    cache.newTtlCache<AdaptiveCreditNotice>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive credit notices. Empty fields match all. */
export class AdaptiveCreditNoticeQuery {
  source: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBudget: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveCreditNotice): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveCreditNotice[]): AdaptiveCreditNotice[] {
    const matched = collections.filter(items, (candidate: AdaptiveCreditNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveCreditNotices(store: AdaptiveCreditNoticeStore, query: AdaptiveCreditNoticeQuery): AdaptiveCreditNotice[] {
  return query.apply(store.list());
}
