import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledWindowNotice } from "./scheduled-window-notice.js";

/** Keeps scheduled window notices by code. */
export interface ScheduledWindowNoticeStore {
  find(code: string): ScheduledWindowNotice | undefined;
  save(item: ScheduledWindowNotice): void;
  remove(code: string): boolean;
  list(): ScheduledWindowNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledWindowNoticeStore implements ScheduledWindowNoticeStore {
  items: Map<string, ScheduledWindowNotice>;
  order: string[];

  constructor(items: Map<string, ScheduledWindowNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledWindowNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledWindowNotice): void {
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

  list(): ScheduledWindowNotice[] {
    const out: ScheduledWindowNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledWindowNoticeStore(): ScheduledWindowNoticeStore {
  return new MemoryScheduledWindowNoticeStore(new Map<string, ScheduledWindowNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledWindowNoticeStore implements ScheduledWindowNoticeStore {
  inner: ScheduledWindowNoticeStore;
  cache: cache.TtlCache<ScheduledWindowNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledWindowNoticeStore,
    cacheValue: cache.TtlCache<ScheduledWindowNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledWindowNotice | undefined {
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

  save(item: ScheduledWindowNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledWindowNotice[] {
    return this.inner.list();
  }
}

export function newCachedScheduledWindowNoticeStore(inner: ScheduledWindowNoticeStore, ttl: number, clockValue: clock.Clock): ScheduledWindowNoticeStore {
  return new CachedScheduledWindowNoticeStore(
    inner,
    cache.newTtlCache<ScheduledWindowNotice>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled window notices. Empty fields match all. */
export class ScheduledWindowNoticeQuery {
  region: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minGraceDays: number, statuses: string[], limit: number) {
    this.region = region;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledWindowNotice): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledWindowNotice[]): ScheduledWindowNotice[] {
    const matched = collections.filter(items, (candidate: ScheduledWindowNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledWindowNotices(store: ScheduledWindowNoticeStore, query: ScheduledWindowNoticeQuery): ScheduledWindowNotice[] {
  return query.apply(store.list());
}
