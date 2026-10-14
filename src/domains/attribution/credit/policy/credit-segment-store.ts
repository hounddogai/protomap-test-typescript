import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditSegment } from "./credit-segment.js";

/** Keeps credit segments by code. */
export interface CreditSegmentStore {
  find(code: string): CreditSegment | undefined;
  save(item: CreditSegment): void;
  remove(code: string): boolean;
  list(): CreditSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditSegmentStore implements CreditSegmentStore {
  items: Map<string, CreditSegment>;
  order: string[];

  constructor(items: Map<string, CreditSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditSegment): void {
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

  list(): CreditSegment[] {
    const out: CreditSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditSegmentStore(): CreditSegmentStore {
  return new MemoryCreditSegmentStore(new Map<string, CreditSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditSegmentStore implements CreditSegmentStore {
  inner: CreditSegmentStore;
  cache: cache.TtlCache<CreditSegment>;
  hits: number;
  misses: number;

  constructor(inner: CreditSegmentStore, cacheValue: cache.TtlCache<CreditSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditSegment | undefined {
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

  save(item: CreditSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditSegment[] {
    return this.inner.list();
  }
}

export function newCachedCreditSegmentStore(inner: CreditSegmentStore, ttl: number, clockValue: clock.Clock): CreditSegmentStore {
  return new CachedCreditSegmentStore(inner, cache.newTtlCache<CreditSegment>(128, ttl, clockValue), 0, 0);
}

/** Selects credit segments. Empty fields match all. */
export class CreditSegmentQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditSegment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditSegment[]): CreditSegment[] {
    const matched = collections.filter(items, (candidate: CreditSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditSegments(store: CreditSegmentStore, query: CreditSegmentQuery): CreditSegment[] {
  return query.apply(store.list());
}
