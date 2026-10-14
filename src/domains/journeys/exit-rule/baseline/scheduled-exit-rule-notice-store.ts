import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledExitRuleNotice } from "./scheduled-exit-rule-notice.js";

/** Keeps scheduled exit rule notices by code. */
export interface ScheduledExitRuleNoticeStore {
  find(code: string): ScheduledExitRuleNotice | undefined;
  save(item: ScheduledExitRuleNotice): void;
  remove(code: string): boolean;
  list(): ScheduledExitRuleNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledExitRuleNoticeStore implements ScheduledExitRuleNoticeStore {
  items: Map<string, ScheduledExitRuleNotice>;
  order: string[];

  constructor(items: Map<string, ScheduledExitRuleNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledExitRuleNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledExitRuleNotice): void {
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

  list(): ScheduledExitRuleNotice[] {
    const out: ScheduledExitRuleNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledExitRuleNoticeStore(): ScheduledExitRuleNoticeStore {
  return new MemoryScheduledExitRuleNoticeStore(new Map<string, ScheduledExitRuleNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledExitRuleNoticeStore implements ScheduledExitRuleNoticeStore {
  inner: ScheduledExitRuleNoticeStore;
  cache: cache.TtlCache<ScheduledExitRuleNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledExitRuleNoticeStore,
    cacheValue: cache.TtlCache<ScheduledExitRuleNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledExitRuleNotice | undefined {
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

  save(item: ScheduledExitRuleNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledExitRuleNotice[] {
    return this.inner.list();
  }
}

export function newCachedScheduledExitRuleNoticeStore(inner: ScheduledExitRuleNoticeStore, ttl: number, clockValue: clock.Clock): ScheduledExitRuleNoticeStore {
  return new CachedScheduledExitRuleNoticeStore(
    inner,
    cache.newTtlCache<ScheduledExitRuleNotice>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled exit rule notices. Empty fields match all. */
export class ScheduledExitRuleNoticeQuery {
  label: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledExitRuleNotice): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledExitRuleNotice[]): ScheduledExitRuleNotice[] {
    const matched = collections.filter(items, (candidate: ScheduledExitRuleNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledExitRuleNotices(store: ScheduledExitRuleNoticeStore, query: ScheduledExitRuleNoticeQuery): ScheduledExitRuleNotice[] {
  return query.apply(store.list());
}
