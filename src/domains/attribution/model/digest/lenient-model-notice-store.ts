import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientModelNotice } from "./lenient-model-notice.js";

/** Keeps lenient model notices by code. */
export interface LenientModelNoticeStore {
  find(code: string): LenientModelNotice | undefined;
  save(item: LenientModelNotice): void;
  remove(code: string): boolean;
  list(): LenientModelNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientModelNoticeStore implements LenientModelNoticeStore {
  items: Map<string, LenientModelNotice>;
  order: string[];

  constructor(items: Map<string, LenientModelNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientModelNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientModelNotice): void {
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

  list(): LenientModelNotice[] {
    const out: LenientModelNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientModelNoticeStore(): LenientModelNoticeStore {
  return new MemoryLenientModelNoticeStore(new Map<string, LenientModelNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientModelNoticeStore implements LenientModelNoticeStore {
  inner: LenientModelNoticeStore;
  cache: cache.TtlCache<LenientModelNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientModelNoticeStore,
    cacheValue: cache.TtlCache<LenientModelNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientModelNotice | undefined {
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

  save(item: LenientModelNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientModelNotice[] {
    return this.inner.list();
  }
}

export function newCachedLenientModelNoticeStore(inner: LenientModelNoticeStore, ttl: number, clockValue: clock.Clock): LenientModelNoticeStore {
  return new CachedLenientModelNoticeStore(inner, cache.newTtlCache<LenientModelNotice>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient model notices. Empty fields match all. */
export class LenientModelNoticeQuery {
  country: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCost: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientModelNotice): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientModelNotice[]): LenientModelNotice[] {
    const matched = collections.filter(items, (candidate: LenientModelNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientModelNotices(store: LenientModelNoticeStore, query: LenientModelNoticeQuery): LenientModelNotice[] {
  return query.apply(store.list());
}
