import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualReplyVariance } from "./manual-reply-variance.js";

/** Keeps manual reply variances by code. */
export interface ManualReplyVarianceStore {
  find(code: string): ManualReplyVariance | undefined;
  save(item: ManualReplyVariance): void;
  remove(code: string): boolean;
  list(): ManualReplyVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualReplyVarianceStore implements ManualReplyVarianceStore {
  items: Map<string, ManualReplyVariance>;
  order: string[];

  constructor(items: Map<string, ManualReplyVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualReplyVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualReplyVariance): void {
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

  list(): ManualReplyVariance[] {
    const out: ManualReplyVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualReplyVarianceStore(): ManualReplyVarianceStore {
  return new MemoryManualReplyVarianceStore(new Map<string, ManualReplyVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualReplyVarianceStore implements ManualReplyVarianceStore {
  inner: ManualReplyVarianceStore;
  cache: cache.TtlCache<ManualReplyVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualReplyVarianceStore,
    cacheValue: cache.TtlCache<ManualReplyVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualReplyVariance | undefined {
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

  save(item: ManualReplyVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualReplyVariance[] {
    return this.inner.list();
  }
}

export function newCachedManualReplyVarianceStore(inner: ManualReplyVarianceStore, ttl: number, clockValue: clock.Clock): ManualReplyVarianceStore {
  return new CachedManualReplyVarianceStore(inner, cache.newTtlCache<ManualReplyVariance>(512, ttl, clockValue), 0, 0);
}

/** Selects manual reply variances. Empty fields match all. */
export class ManualReplyVarianceQuery {
  locale: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minEndsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualReplyVariance): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualReplyVariance[]): ManualReplyVariance[] {
    const matched = collections.filter(items, (candidate: ManualReplyVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualReplyVariances(store: ManualReplyVarianceStore, query: ManualReplyVarianceQuery): ManualReplyVariance[] {
  return query.apply(store.list());
}
