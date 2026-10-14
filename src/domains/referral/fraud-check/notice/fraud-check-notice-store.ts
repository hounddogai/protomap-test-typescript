import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckNotice } from "./fraud-check-notice.js";

/** Keeps fraud check notices by code. */
export interface FraudCheckNoticeStore {
  find(code: string): FraudCheckNotice | undefined;
  save(item: FraudCheckNotice): void;
  remove(code: string): boolean;
  list(): FraudCheckNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckNoticeStore implements FraudCheckNoticeStore {
  items: Map<string, FraudCheckNotice>;
  order: string[];

  constructor(items: Map<string, FraudCheckNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckNotice): void {
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

  list(): FraudCheckNotice[] {
    const out: FraudCheckNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckNoticeStore(): FraudCheckNoticeStore {
  return new MemoryFraudCheckNoticeStore(new Map<string, FraudCheckNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckNoticeStore implements FraudCheckNoticeStore {
  inner: FraudCheckNoticeStore;
  cache: cache.TtlCache<FraudCheckNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckNoticeStore,
    cacheValue: cache.TtlCache<FraudCheckNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckNotice | undefined {
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

  save(item: FraudCheckNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckNotice[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckNoticeStore(inner: FraudCheckNoticeStore, ttl: number, clockValue: clock.Clock): FraudCheckNoticeStore {
  return new CachedFraudCheckNoticeStore(inner, cache.newTtlCache<FraudCheckNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects fraud check notices. Empty fields match all. */
export class FraudCheckNoticeQuery {
  channel: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minGraceDays: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckNotice): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckNotice[]): FraudCheckNotice[] {
    const matched = collections.filter(items, (candidate: FraudCheckNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckNotices(store: FraudCheckNoticeStore, query: FraudCheckNoticeQuery): FraudCheckNotice[] {
  return query.apply(store.list());
}
