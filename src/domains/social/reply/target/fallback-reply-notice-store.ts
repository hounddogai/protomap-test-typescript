import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackReplyNotice } from "./fallback-reply-notice.js";

/** Keeps fallback reply notices by code. */
export interface FallbackReplyNoticeStore {
  find(code: string): FallbackReplyNotice | undefined;
  save(item: FallbackReplyNotice): void;
  remove(code: string): boolean;
  list(): FallbackReplyNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackReplyNoticeStore implements FallbackReplyNoticeStore {
  items: Map<string, FallbackReplyNotice>;
  order: string[];

  constructor(items: Map<string, FallbackReplyNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackReplyNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackReplyNotice): void {
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

  list(): FallbackReplyNotice[] {
    const out: FallbackReplyNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackReplyNoticeStore(): FallbackReplyNoticeStore {
  return new MemoryFallbackReplyNoticeStore(new Map<string, FallbackReplyNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackReplyNoticeStore implements FallbackReplyNoticeStore {
  inner: FallbackReplyNoticeStore;
  cache: cache.TtlCache<FallbackReplyNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackReplyNoticeStore,
    cacheValue: cache.TtlCache<FallbackReplyNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackReplyNotice | undefined {
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

  save(item: FallbackReplyNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackReplyNotice[] {
    return this.inner.list();
  }
}

export function newCachedFallbackReplyNoticeStore(inner: FallbackReplyNoticeStore, ttl: number, clockValue: clock.Clock): FallbackReplyNoticeStore {
  return new CachedFallbackReplyNoticeStore(inner, cache.newTtlCache<FallbackReplyNotice>(512, ttl, clockValue), 0, 0);
}

/** Selects fallback reply notices. Empty fields match all. */
export class FallbackReplyNoticeQuery {
  title: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minThreshold: number, statuses: string[], limit: number) {
    this.title = title;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackReplyNotice): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackReplyNotice[]): FallbackReplyNotice[] {
    const matched = collections.filter(items, (candidate: FallbackReplyNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackReplyNotices(store: FallbackReplyNoticeStore, query: FallbackReplyNoticeQuery): FallbackReplyNotice[] {
  return query.apply(store.list());
}
