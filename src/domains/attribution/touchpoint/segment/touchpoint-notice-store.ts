import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointNotice } from "./touchpoint-notice.js";

/** Keeps touchpoint notices by code. */
export interface TouchpointNoticeStore {
  find(code: string): TouchpointNotice | undefined;
  save(item: TouchpointNotice): void;
  remove(code: string): boolean;
  list(): TouchpointNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointNoticeStore implements TouchpointNoticeStore {
  items: Map<string, TouchpointNotice>;
  order: string[];

  constructor(items: Map<string, TouchpointNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointNotice): void {
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

  list(): TouchpointNotice[] {
    const out: TouchpointNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointNoticeStore(): TouchpointNoticeStore {
  return new MemoryTouchpointNoticeStore(new Map<string, TouchpointNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointNoticeStore implements TouchpointNoticeStore {
  inner: TouchpointNoticeStore;
  cache: cache.TtlCache<TouchpointNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointNoticeStore,
    cacheValue: cache.TtlCache<TouchpointNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointNotice | undefined {
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

  save(item: TouchpointNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointNotice[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointNoticeStore(inner: TouchpointNoticeStore, ttl: number, clockValue: clock.Clock): TouchpointNoticeStore {
  return new CachedTouchpointNoticeStore(inner, cache.newTtlCache<TouchpointNotice>(512, ttl, clockValue), 0, 0);
}

/** Selects touchpoint notices. Empty fields match all. */
export class TouchpointNoticeQuery {
  category: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBudget: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointNotice): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointNotice[]): TouchpointNotice[] {
    const matched = collections.filter(items, (candidate: TouchpointNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointNotices(store: TouchpointNoticeStore, query: TouchpointNoticeQuery): TouchpointNotice[] {
  return query.apply(store.list());
}
