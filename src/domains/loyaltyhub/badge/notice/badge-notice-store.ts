import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeNotice } from "./badge-notice.js";

/** Keeps badge notices by code. */
export interface BadgeNoticeStore {
  find(code: string): BadgeNotice | undefined;
  save(item: BadgeNotice): void;
  remove(code: string): boolean;
  list(): BadgeNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeNoticeStore implements BadgeNoticeStore {
  items: Map<string, BadgeNotice>;
  order: string[];

  constructor(items: Map<string, BadgeNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeNotice): void {
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

  list(): BadgeNotice[] {
    const out: BadgeNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeNoticeStore(): BadgeNoticeStore {
  return new MemoryBadgeNoticeStore(new Map<string, BadgeNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeNoticeStore implements BadgeNoticeStore {
  inner: BadgeNoticeStore;
  cache: cache.TtlCache<BadgeNotice>;
  hits: number;
  misses: number;

  constructor(inner: BadgeNoticeStore, cacheValue: cache.TtlCache<BadgeNotice>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeNotice | undefined {
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

  save(item: BadgeNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeNotice[] {
    return this.inner.list();
  }
}

export function newCachedBadgeNoticeStore(inner: BadgeNoticeStore, ttl: number, clockValue: clock.Clock): BadgeNoticeStore {
  return new CachedBadgeNoticeStore(inner, cache.newTtlCache<BadgeNotice>(128, ttl, clockValue), 0, 0);
}

/** Selects badge notices. Empty fields match all. */
export class BadgeNoticeQuery {
  category: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minDiscount: number, statuses: string[], limit: number) {
    this.category = category;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeNotice): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeNotice[]): BadgeNotice[] {
    const matched = collections.filter(items, (candidate: BadgeNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeNotices(store: BadgeNoticeStore, query: BadgeNoticeQuery): BadgeNotice[] {
  return query.apply(store.list());
}
