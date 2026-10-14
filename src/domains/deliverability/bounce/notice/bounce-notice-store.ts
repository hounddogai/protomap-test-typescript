import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceNotice } from "./bounce-notice.js";

/** Keeps bounce notices by code. */
export interface BounceNoticeStore {
  find(code: string): BounceNotice | undefined;
  save(item: BounceNotice): void;
  remove(code: string): boolean;
  list(): BounceNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceNoticeStore implements BounceNoticeStore {
  items: Map<string, BounceNotice>;
  order: string[];

  constructor(items: Map<string, BounceNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceNotice): void {
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

  list(): BounceNotice[] {
    const out: BounceNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceNoticeStore(): BounceNoticeStore {
  return new MemoryBounceNoticeStore(new Map<string, BounceNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceNoticeStore implements BounceNoticeStore {
  inner: BounceNoticeStore;
  cache: cache.TtlCache<BounceNotice>;
  hits: number;
  misses: number;

  constructor(inner: BounceNoticeStore, cacheValue: cache.TtlCache<BounceNotice>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceNotice | undefined {
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

  save(item: BounceNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceNotice[] {
    return this.inner.list();
  }
}

export function newCachedBounceNoticeStore(inner: BounceNoticeStore, ttl: number, clockValue: clock.Clock): BounceNoticeStore {
  return new CachedBounceNoticeStore(inner, cache.newTtlCache<BounceNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects bounce notices. Empty fields match all. */
export class BounceNoticeQuery {
  channel: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMinimum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceNotice): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceNotice[]): BounceNotice[] {
    const matched = collections.filter(items, (candidate: BounceNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceNotices(store: BounceNoticeStore, query: BounceNoticeQuery): BounceNotice[] {
  return query.apply(store.list());
}
