import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFrequencyNotice } from "./scheduled-frequency-notice.js";

/** Keeps scheduled frequency notices by code. */
export interface ScheduledFrequencyNoticeStore {
  find(code: string): ScheduledFrequencyNotice | undefined;
  save(item: ScheduledFrequencyNotice): void;
  remove(code: string): boolean;
  list(): ScheduledFrequencyNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFrequencyNoticeStore implements ScheduledFrequencyNoticeStore {
  items: Map<string, ScheduledFrequencyNotice>;
  order: string[];

  constructor(items: Map<string, ScheduledFrequencyNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFrequencyNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFrequencyNotice): void {
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

  list(): ScheduledFrequencyNotice[] {
    const out: ScheduledFrequencyNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFrequencyNoticeStore(): ScheduledFrequencyNoticeStore {
  return new MemoryScheduledFrequencyNoticeStore(new Map<string, ScheduledFrequencyNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFrequencyNoticeStore implements ScheduledFrequencyNoticeStore {
  inner: ScheduledFrequencyNoticeStore;
  cache: cache.TtlCache<ScheduledFrequencyNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFrequencyNoticeStore,
    cacheValue: cache.TtlCache<ScheduledFrequencyNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFrequencyNotice | undefined {
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

  save(item: ScheduledFrequencyNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFrequencyNotice[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFrequencyNoticeStore(inner: ScheduledFrequencyNoticeStore, ttl: number, clockValue: clock.Clock): ScheduledFrequencyNoticeStore {
  return new CachedScheduledFrequencyNoticeStore(
    inner,
    cache.newTtlCache<ScheduledFrequencyNotice>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled frequency notices. Empty fields match all. */
export class ScheduledFrequencyNoticeQuery {
  source: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFrequencyNotice): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFrequencyNotice[]): ScheduledFrequencyNotice[] {
    const matched = collections.filter(items, (candidate: ScheduledFrequencyNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFrequencyNotices(store: ScheduledFrequencyNoticeStore, query: ScheduledFrequencyNoticeQuery): ScheduledFrequencyNotice[] {
  return query.apply(store.list());
}
