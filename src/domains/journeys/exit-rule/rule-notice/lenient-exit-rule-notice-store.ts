import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientExitRuleNotice } from "./lenient-exit-rule-notice.js";

/** Keeps lenient exit rule notices by code. */
export interface LenientExitRuleNoticeStore {
  find(code: string): LenientExitRuleNotice | undefined;
  save(item: LenientExitRuleNotice): void;
  remove(code: string): boolean;
  list(): LenientExitRuleNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientExitRuleNoticeStore implements LenientExitRuleNoticeStore {
  items: Map<string, LenientExitRuleNotice>;
  order: string[];

  constructor(items: Map<string, LenientExitRuleNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientExitRuleNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientExitRuleNotice): void {
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

  list(): LenientExitRuleNotice[] {
    const out: LenientExitRuleNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientExitRuleNoticeStore(): LenientExitRuleNoticeStore {
  return new MemoryLenientExitRuleNoticeStore(new Map<string, LenientExitRuleNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientExitRuleNoticeStore implements LenientExitRuleNoticeStore {
  inner: LenientExitRuleNoticeStore;
  cache: cache.TtlCache<LenientExitRuleNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientExitRuleNoticeStore,
    cacheValue: cache.TtlCache<LenientExitRuleNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientExitRuleNotice | undefined {
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

  save(item: LenientExitRuleNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientExitRuleNotice[] {
    return this.inner.list();
  }
}

export function newCachedLenientExitRuleNoticeStore(inner: LenientExitRuleNoticeStore, ttl: number, clockValue: clock.Clock): LenientExitRuleNoticeStore {
  return new CachedLenientExitRuleNoticeStore(
    inner,
    cache.newTtlCache<LenientExitRuleNotice>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient exit rule notices. Empty fields match all. */
export class LenientExitRuleNoticeQuery {
  title: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWindowDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientExitRuleNotice): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientExitRuleNotice[]): LenientExitRuleNotice[] {
    const matched = collections.filter(items, (candidate: LenientExitRuleNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientExitRuleNotices(store: LenientExitRuleNoticeStore, query: LenientExitRuleNoticeQuery): LenientExitRuleNotice[] {
  return query.apply(store.list());
}
