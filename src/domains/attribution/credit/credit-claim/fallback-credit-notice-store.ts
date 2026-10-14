import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackCreditNotice } from "./fallback-credit-notice.js";

/** Keeps fallback credit notices by code. */
export interface FallbackCreditNoticeStore {
  find(code: string): FallbackCreditNotice | undefined;
  save(item: FallbackCreditNotice): void;
  remove(code: string): boolean;
  list(): FallbackCreditNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackCreditNoticeStore implements FallbackCreditNoticeStore {
  items: Map<string, FallbackCreditNotice>;
  order: string[];

  constructor(items: Map<string, FallbackCreditNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackCreditNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackCreditNotice): void {
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

  list(): FallbackCreditNotice[] {
    const out: FallbackCreditNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackCreditNoticeStore(): FallbackCreditNoticeStore {
  return new MemoryFallbackCreditNoticeStore(new Map<string, FallbackCreditNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackCreditNoticeStore implements FallbackCreditNoticeStore {
  inner: FallbackCreditNoticeStore;
  cache: cache.TtlCache<FallbackCreditNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackCreditNoticeStore,
    cacheValue: cache.TtlCache<FallbackCreditNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackCreditNotice | undefined {
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

  save(item: FallbackCreditNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackCreditNotice[] {
    return this.inner.list();
  }
}

export function newCachedFallbackCreditNoticeStore(inner: FallbackCreditNoticeStore, ttl: number, clockValue: clock.Clock): FallbackCreditNoticeStore {
  return new CachedFallbackCreditNoticeStore(
    inner,
    cache.newTtlCache<FallbackCreditNotice>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback credit notices. Empty fields match all. */
export class FallbackCreditNoticeQuery {
  channel: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackCreditNotice): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackCreditNotice[]): FallbackCreditNotice[] {
    const matched = collections.filter(items, (candidate: FallbackCreditNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackCreditNotices(store: FallbackCreditNoticeStore, query: FallbackCreditNoticeQuery): FallbackCreditNotice[] {
  return query.apply(store.list());
}
