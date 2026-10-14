import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionNotice } from "./redemption-notice.js";

/** Keeps redemption notices by code. */
export interface RedemptionNoticeStore {
  find(code: string): RedemptionNotice | undefined;
  save(item: RedemptionNotice): void;
  remove(code: string): boolean;
  list(): RedemptionNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionNoticeStore implements RedemptionNoticeStore {
  items: Map<string, RedemptionNotice>;
  order: string[];

  constructor(items: Map<string, RedemptionNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionNotice): void {
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

  list(): RedemptionNotice[] {
    const out: RedemptionNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionNoticeStore(): RedemptionNoticeStore {
  return new MemoryRedemptionNoticeStore(new Map<string, RedemptionNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionNoticeStore implements RedemptionNoticeStore {
  inner: RedemptionNoticeStore;
  cache: cache.TtlCache<RedemptionNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionNoticeStore,
    cacheValue: cache.TtlCache<RedemptionNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionNotice | undefined {
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

  save(item: RedemptionNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionNotice[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionNoticeStore(inner: RedemptionNoticeStore, ttl: number, clockValue: clock.Clock): RedemptionNoticeStore {
  return new CachedRedemptionNoticeStore(inner, cache.newTtlCache<RedemptionNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects redemption notices. Empty fields match all. */
export class RedemptionNoticeQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionNotice): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionNotice[]): RedemptionNotice[] {
    const matched = collections.filter(items, (candidate: RedemptionNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionNotices(store: RedemptionNoticeStore, query: RedemptionNoticeQuery): RedemptionNotice[] {
  return query.apply(store.list());
}
