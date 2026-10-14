import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedWindowNotice } from "./capped-window-notice.js";

/** Keeps capped window notices by code. */
export interface CappedWindowNoticeStore {
  find(code: string): CappedWindowNotice | undefined;
  save(item: CappedWindowNotice): void;
  remove(code: string): boolean;
  list(): CappedWindowNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedWindowNoticeStore implements CappedWindowNoticeStore {
  items: Map<string, CappedWindowNotice>;
  order: string[];

  constructor(items: Map<string, CappedWindowNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedWindowNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedWindowNotice): void {
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

  list(): CappedWindowNotice[] {
    const out: CappedWindowNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedWindowNoticeStore(): CappedWindowNoticeStore {
  return new MemoryCappedWindowNoticeStore(new Map<string, CappedWindowNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedWindowNoticeStore implements CappedWindowNoticeStore {
  inner: CappedWindowNoticeStore;
  cache: cache.TtlCache<CappedWindowNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedWindowNoticeStore,
    cacheValue: cache.TtlCache<CappedWindowNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedWindowNotice | undefined {
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

  save(item: CappedWindowNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedWindowNotice[] {
    return this.inner.list();
  }
}

export function newCachedCappedWindowNoticeStore(inner: CappedWindowNoticeStore, ttl: number, clockValue: clock.Clock): CappedWindowNoticeStore {
  return new CachedCappedWindowNoticeStore(inner, cache.newTtlCache<CappedWindowNotice>(64, ttl, clockValue), 0, 0);
}

/** Selects capped window notices. Empty fields match all. */
export class CappedWindowNoticeQuery {
  category: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minVersion: number, statuses: string[], limit: number) {
    this.category = category;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedWindowNotice): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedWindowNotice[]): CappedWindowNotice[] {
    const matched = collections.filter(items, (candidate: CappedWindowNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedWindowNotices(store: CappedWindowNoticeStore, query: CappedWindowNoticeQuery): CappedWindowNotice[] {
  return query.apply(store.list());
}
