import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalFrequencyNotice } from "./global-frequency-notice.js";

/** Keeps global frequency notices by code. */
export interface GlobalFrequencyNoticeStore {
  find(code: string): GlobalFrequencyNotice | undefined;
  save(item: GlobalFrequencyNotice): void;
  remove(code: string): boolean;
  list(): GlobalFrequencyNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalFrequencyNoticeStore implements GlobalFrequencyNoticeStore {
  items: Map<string, GlobalFrequencyNotice>;
  order: string[];

  constructor(items: Map<string, GlobalFrequencyNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalFrequencyNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalFrequencyNotice): void {
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

  list(): GlobalFrequencyNotice[] {
    const out: GlobalFrequencyNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalFrequencyNoticeStore(): GlobalFrequencyNoticeStore {
  return new MemoryGlobalFrequencyNoticeStore(new Map<string, GlobalFrequencyNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalFrequencyNoticeStore implements GlobalFrequencyNoticeStore {
  inner: GlobalFrequencyNoticeStore;
  cache: cache.TtlCache<GlobalFrequencyNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalFrequencyNoticeStore,
    cacheValue: cache.TtlCache<GlobalFrequencyNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalFrequencyNotice | undefined {
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

  save(item: GlobalFrequencyNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalFrequencyNotice[] {
    return this.inner.list();
  }
}

export function newCachedGlobalFrequencyNoticeStore(inner: GlobalFrequencyNoticeStore, ttl: number, clockValue: clock.Clock): GlobalFrequencyNoticeStore {
  return new CachedGlobalFrequencyNoticeStore(
    inner,
    cache.newTtlCache<GlobalFrequencyNotice>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global frequency notices. Empty fields match all. */
export class GlobalFrequencyNoticeQuery {
  segment: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMinimum: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalFrequencyNotice): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalFrequencyNotice[]): GlobalFrequencyNotice[] {
    const matched = collections.filter(items, (candidate: GlobalFrequencyNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalFrequencyNotices(store: GlobalFrequencyNoticeStore, query: GlobalFrequencyNoticeQuery): GlobalFrequencyNotice[] {
  return query.apply(store.list());
}
