import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackNudgeNotice } from "./fallback-nudge-notice.js";

/** Keeps fallback nudge notices by code. */
export interface FallbackNudgeNoticeStore {
  find(code: string): FallbackNudgeNotice | undefined;
  save(item: FallbackNudgeNotice): void;
  remove(code: string): boolean;
  list(): FallbackNudgeNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackNudgeNoticeStore implements FallbackNudgeNoticeStore {
  items: Map<string, FallbackNudgeNotice>;
  order: string[];

  constructor(items: Map<string, FallbackNudgeNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackNudgeNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackNudgeNotice): void {
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

  list(): FallbackNudgeNotice[] {
    const out: FallbackNudgeNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackNudgeNoticeStore(): FallbackNudgeNoticeStore {
  return new MemoryFallbackNudgeNoticeStore(new Map<string, FallbackNudgeNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackNudgeNoticeStore implements FallbackNudgeNoticeStore {
  inner: FallbackNudgeNoticeStore;
  cache: cache.TtlCache<FallbackNudgeNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackNudgeNoticeStore,
    cacheValue: cache.TtlCache<FallbackNudgeNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackNudgeNotice | undefined {
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

  save(item: FallbackNudgeNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackNudgeNotice[] {
    return this.inner.list();
  }
}

export function newCachedFallbackNudgeNoticeStore(inner: FallbackNudgeNoticeStore, ttl: number, clockValue: clock.Clock): FallbackNudgeNoticeStore {
  return new CachedFallbackNudgeNoticeStore(inner, cache.newTtlCache<FallbackNudgeNotice>(1024, ttl, clockValue), 0, 0);
}

/** Selects fallback nudge notices. Empty fields match all. */
export class FallbackNudgeNoticeQuery {
  segment: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minImpressions: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackNudgeNotice): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackNudgeNotice[]): FallbackNudgeNotice[] {
    const matched = collections.filter(items, (candidate: FallbackNudgeNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackNudgeNotices(store: FallbackNudgeNoticeStore, query: FallbackNudgeNoticeQuery): FallbackNudgeNotice[] {
  return query.apply(store.list());
}
