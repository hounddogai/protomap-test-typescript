import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionNotice } from "./suppression-notice.js";

/** Keeps suppression notices by code. */
export interface SuppressionNoticeStore {
  find(code: string): SuppressionNotice | undefined;
  save(item: SuppressionNotice): void;
  remove(code: string): boolean;
  list(): SuppressionNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionNoticeStore implements SuppressionNoticeStore {
  items: Map<string, SuppressionNotice>;
  order: string[];

  constructor(items: Map<string, SuppressionNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionNotice): void {
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

  list(): SuppressionNotice[] {
    const out: SuppressionNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionNoticeStore(): SuppressionNoticeStore {
  return new MemorySuppressionNoticeStore(new Map<string, SuppressionNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionNoticeStore implements SuppressionNoticeStore {
  inner: SuppressionNoticeStore;
  cache: cache.TtlCache<SuppressionNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionNoticeStore,
    cacheValue: cache.TtlCache<SuppressionNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionNotice | undefined {
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

  save(item: SuppressionNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionNotice[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionNoticeStore(inner: SuppressionNoticeStore, ttl: number, clockValue: clock.Clock): SuppressionNoticeStore {
  return new CachedSuppressionNoticeStore(inner, cache.newTtlCache<SuppressionNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects suppression notices. Empty fields match all. */
export class SuppressionNoticeQuery {
  source: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.source = source;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionNotice): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionNotice[]): SuppressionNotice[] {
    const matched = collections.filter(items, (candidate: SuppressionNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionNotices(store: SuppressionNoticeStore, query: SuppressionNoticeQuery): SuppressionNotice[] {
  return query.apply(store.list());
}
