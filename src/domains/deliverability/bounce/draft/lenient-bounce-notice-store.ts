import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientBounceNotice } from "./lenient-bounce-notice.js";

/** Keeps lenient bounce notices by code. */
export interface LenientBounceNoticeStore {
  find(code: string): LenientBounceNotice | undefined;
  save(item: LenientBounceNotice): void;
  remove(code: string): boolean;
  list(): LenientBounceNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientBounceNoticeStore implements LenientBounceNoticeStore {
  items: Map<string, LenientBounceNotice>;
  order: string[];

  constructor(items: Map<string, LenientBounceNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientBounceNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientBounceNotice): void {
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

  list(): LenientBounceNotice[] {
    const out: LenientBounceNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientBounceNoticeStore(): LenientBounceNoticeStore {
  return new MemoryLenientBounceNoticeStore(new Map<string, LenientBounceNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientBounceNoticeStore implements LenientBounceNoticeStore {
  inner: LenientBounceNoticeStore;
  cache: cache.TtlCache<LenientBounceNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientBounceNoticeStore,
    cacheValue: cache.TtlCache<LenientBounceNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientBounceNotice | undefined {
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

  save(item: LenientBounceNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientBounceNotice[] {
    return this.inner.list();
  }
}

export function newCachedLenientBounceNoticeStore(inner: LenientBounceNoticeStore, ttl: number, clockValue: clock.Clock): LenientBounceNoticeStore {
  return new CachedLenientBounceNoticeStore(inner, cache.newTtlCache<LenientBounceNotice>(512, ttl, clockValue), 0, 0);
}

/** Selects lenient bounce notices. Empty fields match all. */
export class LenientBounceNoticeQuery {
  locale: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRevision: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientBounceNotice): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientBounceNotice[]): LenientBounceNotice[] {
    const matched = collections.filter(items, (candidate: LenientBounceNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientBounceNotices(store: LenientBounceNoticeStore, query: LenientBounceNoticeQuery): LenientBounceNotice[] {
  return query.apply(store.list());
}
