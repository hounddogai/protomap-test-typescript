import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleNotice } from "./exit-rule-notice.js";

/** Keeps exit rule notices by code. */
export interface ExitRuleNoticeStore {
  find(code: string): ExitRuleNotice | undefined;
  save(item: ExitRuleNotice): void;
  remove(code: string): boolean;
  list(): ExitRuleNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleNoticeStore implements ExitRuleNoticeStore {
  items: Map<string, ExitRuleNotice>;
  order: string[];

  constructor(items: Map<string, ExitRuleNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleNotice): void {
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

  list(): ExitRuleNotice[] {
    const out: ExitRuleNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleNoticeStore(): ExitRuleNoticeStore {
  return new MemoryExitRuleNoticeStore(new Map<string, ExitRuleNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleNoticeStore implements ExitRuleNoticeStore {
  inner: ExitRuleNoticeStore;
  cache: cache.TtlCache<ExitRuleNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleNoticeStore,
    cacheValue: cache.TtlCache<ExitRuleNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleNotice | undefined {
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

  save(item: ExitRuleNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleNotice[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleNoticeStore(inner: ExitRuleNoticeStore, ttl: number, clockValue: clock.Clock): ExitRuleNoticeStore {
  return new CachedExitRuleNoticeStore(inner, cache.newTtlCache<ExitRuleNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects exit rule notices. Empty fields match all. */
export class ExitRuleNoticeQuery {
  channel: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBid: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleNotice): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleNotice[]): ExitRuleNotice[] {
    const matched = collections.filter(items, (candidate: ExitRuleNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleNotices(store: ExitRuleNoticeStore, query: ExitRuleNoticeQuery): ExitRuleNotice[] {
  return query.apply(store.list());
}
