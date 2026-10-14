import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientStreakNotice } from "./lenient-streak-notice.js";

/** Keeps lenient streak notices by code. */
export interface LenientStreakNoticeStore {
  find(code: string): LenientStreakNotice | undefined;
  save(item: LenientStreakNotice): void;
  remove(code: string): boolean;
  list(): LenientStreakNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientStreakNoticeStore implements LenientStreakNoticeStore {
  items: Map<string, LenientStreakNotice>;
  order: string[];

  constructor(items: Map<string, LenientStreakNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientStreakNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientStreakNotice): void {
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

  list(): LenientStreakNotice[] {
    const out: LenientStreakNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientStreakNoticeStore(): LenientStreakNoticeStore {
  return new MemoryLenientStreakNoticeStore(new Map<string, LenientStreakNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientStreakNoticeStore implements LenientStreakNoticeStore {
  inner: LenientStreakNoticeStore;
  cache: cache.TtlCache<LenientStreakNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientStreakNoticeStore,
    cacheValue: cache.TtlCache<LenientStreakNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientStreakNotice | undefined {
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

  save(item: LenientStreakNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientStreakNotice[] {
    return this.inner.list();
  }
}

export function newCachedLenientStreakNoticeStore(inner: LenientStreakNoticeStore, ttl: number, clockValue: clock.Clock): LenientStreakNoticeStore {
  return new CachedLenientStreakNoticeStore(inner, cache.newTtlCache<LenientStreakNotice>(1024, ttl, clockValue), 0, 0);
}

/** Selects lenient streak notices. Empty fields match all. */
export class LenientStreakNoticeQuery {
  locale: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMaximum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientStreakNotice): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientStreakNotice[]): LenientStreakNotice[] {
    const matched = collections.filter(items, (candidate: LenientStreakNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientStreakNotices(store: LenientStreakNoticeStore, query: LenientStreakNoticeQuery): LenientStreakNotice[] {
  return query.apply(store.list());
}
