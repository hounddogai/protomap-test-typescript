import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredConversionNotice } from "./tiered-conversion-notice.js";

/** Keeps tiered conversion notices by code. */
export interface TieredConversionNoticeStore {
  find(code: string): TieredConversionNotice | undefined;
  save(item: TieredConversionNotice): void;
  remove(code: string): boolean;
  list(): TieredConversionNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredConversionNoticeStore implements TieredConversionNoticeStore {
  items: Map<string, TieredConversionNotice>;
  order: string[];

  constructor(items: Map<string, TieredConversionNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredConversionNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredConversionNotice): void {
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

  list(): TieredConversionNotice[] {
    const out: TieredConversionNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredConversionNoticeStore(): TieredConversionNoticeStore {
  return new MemoryTieredConversionNoticeStore(new Map<string, TieredConversionNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredConversionNoticeStore implements TieredConversionNoticeStore {
  inner: TieredConversionNoticeStore;
  cache: cache.TtlCache<TieredConversionNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredConversionNoticeStore,
    cacheValue: cache.TtlCache<TieredConversionNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredConversionNotice | undefined {
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

  save(item: TieredConversionNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredConversionNotice[] {
    return this.inner.list();
  }
}

export function newCachedTieredConversionNoticeStore(inner: TieredConversionNoticeStore, ttl: number, clockValue: clock.Clock): TieredConversionNoticeStore {
  return new CachedTieredConversionNoticeStore(
    inner,
    cache.newTtlCache<TieredConversionNotice>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered conversion notices. Empty fields match all. */
export class TieredConversionNoticeQuery {
  label: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDiscount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredConversionNotice): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredConversionNotice[]): TieredConversionNotice[] {
    const matched = collections.filter(items, (candidate: TieredConversionNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredConversionNotices(store: TieredConversionNoticeStore, query: TieredConversionNoticeQuery): TieredConversionNotice[] {
  return query.apply(store.list());
}
