import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingConversionNotice } from "./pending-conversion-notice.js";

/** Keeps pending conversion notices by code. */
export interface PendingConversionNoticeStore {
  find(code: string): PendingConversionNotice | undefined;
  save(item: PendingConversionNotice): void;
  remove(code: string): boolean;
  list(): PendingConversionNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingConversionNoticeStore implements PendingConversionNoticeStore {
  items: Map<string, PendingConversionNotice>;
  order: string[];

  constructor(items: Map<string, PendingConversionNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingConversionNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingConversionNotice): void {
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

  list(): PendingConversionNotice[] {
    const out: PendingConversionNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingConversionNoticeStore(): PendingConversionNoticeStore {
  return new MemoryPendingConversionNoticeStore(new Map<string, PendingConversionNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingConversionNoticeStore implements PendingConversionNoticeStore {
  inner: PendingConversionNoticeStore;
  cache: cache.TtlCache<PendingConversionNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingConversionNoticeStore,
    cacheValue: cache.TtlCache<PendingConversionNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingConversionNotice | undefined {
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

  save(item: PendingConversionNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingConversionNotice[] {
    return this.inner.list();
  }
}

export function newCachedPendingConversionNoticeStore(inner: PendingConversionNoticeStore, ttl: number, clockValue: clock.Clock): PendingConversionNoticeStore {
  return new CachedPendingConversionNoticeStore(
    inner,
    cache.newTtlCache<PendingConversionNotice>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending conversion notices. Empty fields match all. */
export class PendingConversionNoticeQuery {
  segment: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minScore: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingConversionNotice): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingConversionNotice[]): PendingConversionNotice[] {
    const matched = collections.filter(items, (candidate: PendingConversionNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingConversionNotices(store: PendingConversionNoticeStore, query: PendingConversionNoticeQuery): PendingConversionNotice[] {
  return query.apply(store.list());
}
