import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightNotice } from "./insight-notice.js";

/** Keeps insight notices by code. */
export interface InsightNoticeStore {
  find(code: string): InsightNotice | undefined;
  save(item: InsightNotice): void;
  remove(code: string): boolean;
  list(): InsightNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightNoticeStore implements InsightNoticeStore {
  items: Map<string, InsightNotice>;
  order: string[];

  constructor(items: Map<string, InsightNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightNotice): void {
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

  list(): InsightNotice[] {
    const out: InsightNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightNoticeStore(): InsightNoticeStore {
  return new MemoryInsightNoticeStore(new Map<string, InsightNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightNoticeStore implements InsightNoticeStore {
  inner: InsightNoticeStore;
  cache: cache.TtlCache<InsightNotice>;
  hits: number;
  misses: number;

  constructor(inner: InsightNoticeStore, cacheValue: cache.TtlCache<InsightNotice>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightNotice | undefined {
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

  save(item: InsightNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightNotice[] {
    return this.inner.list();
  }
}

export function newCachedInsightNoticeStore(inner: InsightNoticeStore, ttl: number, clockValue: clock.Clock): InsightNoticeStore {
  return new CachedInsightNoticeStore(inner, cache.newTtlCache<InsightNotice>(1024, ttl, clockValue), 0, 0);
}

/** Selects insight notices. Empty fields match all. */
export class InsightNoticeQuery {
  segment: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minLimit: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightNotice): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightNotice[]): InsightNotice[] {
    const matched = collections.filter(items, (candidate: InsightNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightNotices(store: InsightNoticeStore, query: InsightNoticeQuery): InsightNotice[] {
  return query.apply(store.list());
}
