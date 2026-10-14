import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledBidRuleNotice } from "./scheduled-bid-rule-notice.js";

/** Keeps scheduled bid rule notices by code. */
export interface ScheduledBidRuleNoticeStore {
  find(code: string): ScheduledBidRuleNotice | undefined;
  save(item: ScheduledBidRuleNotice): void;
  remove(code: string): boolean;
  list(): ScheduledBidRuleNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledBidRuleNoticeStore implements ScheduledBidRuleNoticeStore {
  items: Map<string, ScheduledBidRuleNotice>;
  order: string[];

  constructor(items: Map<string, ScheduledBidRuleNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledBidRuleNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledBidRuleNotice): void {
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

  list(): ScheduledBidRuleNotice[] {
    const out: ScheduledBidRuleNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledBidRuleNoticeStore(): ScheduledBidRuleNoticeStore {
  return new MemoryScheduledBidRuleNoticeStore(new Map<string, ScheduledBidRuleNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledBidRuleNoticeStore implements ScheduledBidRuleNoticeStore {
  inner: ScheduledBidRuleNoticeStore;
  cache: cache.TtlCache<ScheduledBidRuleNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledBidRuleNoticeStore,
    cacheValue: cache.TtlCache<ScheduledBidRuleNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledBidRuleNotice | undefined {
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

  save(item: ScheduledBidRuleNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledBidRuleNotice[] {
    return this.inner.list();
  }
}

export function newCachedScheduledBidRuleNoticeStore(inner: ScheduledBidRuleNoticeStore, ttl: number, clockValue: clock.Clock): ScheduledBidRuleNoticeStore {
  return new CachedScheduledBidRuleNoticeStore(
    inner,
    cache.newTtlCache<ScheduledBidRuleNotice>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled bid rule notices. Empty fields match all. */
export class ScheduledBidRuleNoticeQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledBidRuleNotice): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledBidRuleNotice[]): ScheduledBidRuleNotice[] {
    const matched = collections.filter(items, (candidate: ScheduledBidRuleNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledBidRuleNotices(store: ScheduledBidRuleNoticeStore, query: ScheduledBidRuleNoticeQuery): ScheduledBidRuleNotice[] {
  return query.apply(store.list());
}
