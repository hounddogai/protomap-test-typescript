import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionNotice } from "./retention-notice.js";

/** Keeps retention notices by code. */
export interface RetentionNoticeStore {
  find(code: string): RetentionNotice | undefined;
  save(item: RetentionNotice): void;
  remove(code: string): boolean;
  list(): RetentionNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionNoticeStore implements RetentionNoticeStore {
  items: Map<string, RetentionNotice>;
  order: string[];

  constructor(items: Map<string, RetentionNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionNotice): void {
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

  list(): RetentionNotice[] {
    const out: RetentionNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionNoticeStore(): RetentionNoticeStore {
  return new MemoryRetentionNoticeStore(new Map<string, RetentionNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionNoticeStore implements RetentionNoticeStore {
  inner: RetentionNoticeStore;
  cache: cache.TtlCache<RetentionNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionNoticeStore,
    cacheValue: cache.TtlCache<RetentionNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionNotice | undefined {
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

  save(item: RetentionNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionNotice[] {
    return this.inner.list();
  }
}

export function newCachedRetentionNoticeStore(inner: RetentionNoticeStore, ttl: number, clockValue: clock.Clock): RetentionNoticeStore {
  return new CachedRetentionNoticeStore(inner, cache.newTtlCache<RetentionNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects retention notices. Empty fields match all. */
export class RetentionNoticeQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionNotice): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionNotice[]): RetentionNotice[] {
    const matched = collections.filter(items, (candidate: RetentionNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionNotices(store: RetentionNoticeStore, query: RetentionNoticeQuery): RetentionNotice[] {
  return query.apply(store.list());
}
