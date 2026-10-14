import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierNotice } from "./tier-notice.js";

/** Keeps tier notices by code. */
export interface TierNoticeStore {
  find(code: string): TierNotice | undefined;
  save(item: TierNotice): void;
  remove(code: string): boolean;
  list(): TierNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierNoticeStore implements TierNoticeStore {
  items: Map<string, TierNotice>;
  order: string[];

  constructor(items: Map<string, TierNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierNotice): void {
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

  list(): TierNotice[] {
    const out: TierNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierNoticeStore(): TierNoticeStore {
  return new MemoryTierNoticeStore(new Map<string, TierNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierNoticeStore implements TierNoticeStore {
  inner: TierNoticeStore;
  cache: cache.TtlCache<TierNotice>;
  hits: number;
  misses: number;

  constructor(inner: TierNoticeStore, cacheValue: cache.TtlCache<TierNotice>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierNotice | undefined {
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

  save(item: TierNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierNotice[] {
    return this.inner.list();
  }
}

export function newCachedTierNoticeStore(inner: TierNoticeStore, ttl: number, clockValue: clock.Clock): TierNoticeStore {
  return new CachedTierNoticeStore(inner, cache.newTtlCache<TierNotice>(128, ttl, clockValue), 0, 0);
}

/** Selects tier notices. Empty fields match all. */
export class TierNoticeQuery {
  channel: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMaximum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierNotice): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierNotice[]): TierNotice[] {
    const matched = collections.filter(items, (candidate: TierNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierNotices(store: TierNoticeStore, query: TierNoticeQuery): TierNotice[] {
  return query.apply(store.list());
}
