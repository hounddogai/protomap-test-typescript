import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionNotice } from "./conversion-notice.js";

/** Keeps conversion notices by code. */
export interface ConversionNoticeStore {
  find(code: string): ConversionNotice | undefined;
  save(item: ConversionNotice): void;
  remove(code: string): boolean;
  list(): ConversionNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionNoticeStore implements ConversionNoticeStore {
  items: Map<string, ConversionNotice>;
  order: string[];

  constructor(items: Map<string, ConversionNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionNotice): void {
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

  list(): ConversionNotice[] {
    const out: ConversionNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionNoticeStore(): ConversionNoticeStore {
  return new MemoryConversionNoticeStore(new Map<string, ConversionNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionNoticeStore implements ConversionNoticeStore {
  inner: ConversionNoticeStore;
  cache: cache.TtlCache<ConversionNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionNoticeStore,
    cacheValue: cache.TtlCache<ConversionNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionNotice | undefined {
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

  save(item: ConversionNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionNotice[] {
    return this.inner.list();
  }
}

export function newCachedConversionNoticeStore(inner: ConversionNoticeStore, ttl: number, clockValue: clock.Clock): ConversionNoticeStore {
  return new CachedConversionNoticeStore(inner, cache.newTtlCache<ConversionNotice>(64, ttl, clockValue), 0, 0);
}

/** Selects conversion notices. Empty fields match all. */
export class ConversionNoticeQuery {
  label: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSequence: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionNotice): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionNotice[]): ConversionNotice[] {
    const matched = collections.filter(items, (candidate: ConversionNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionNotices(store: ConversionNoticeStore, query: ConversionNoticeQuery): ConversionNotice[] {
  return query.apply(store.list());
}
