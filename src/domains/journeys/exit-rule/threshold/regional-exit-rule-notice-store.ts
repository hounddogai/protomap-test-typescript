import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalExitRuleNotice } from "./regional-exit-rule-notice.js";

/** Keeps regional exit rule notices by code. */
export interface RegionalExitRuleNoticeStore {
  find(code: string): RegionalExitRuleNotice | undefined;
  save(item: RegionalExitRuleNotice): void;
  remove(code: string): boolean;
  list(): RegionalExitRuleNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalExitRuleNoticeStore implements RegionalExitRuleNoticeStore {
  items: Map<string, RegionalExitRuleNotice>;
  order: string[];

  constructor(items: Map<string, RegionalExitRuleNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalExitRuleNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalExitRuleNotice): void {
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

  list(): RegionalExitRuleNotice[] {
    const out: RegionalExitRuleNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalExitRuleNoticeStore(): RegionalExitRuleNoticeStore {
  return new MemoryRegionalExitRuleNoticeStore(new Map<string, RegionalExitRuleNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalExitRuleNoticeStore implements RegionalExitRuleNoticeStore {
  inner: RegionalExitRuleNoticeStore;
  cache: cache.TtlCache<RegionalExitRuleNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalExitRuleNoticeStore,
    cacheValue: cache.TtlCache<RegionalExitRuleNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalExitRuleNotice | undefined {
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

  save(item: RegionalExitRuleNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalExitRuleNotice[] {
    return this.inner.list();
  }
}

export function newCachedRegionalExitRuleNoticeStore(inner: RegionalExitRuleNoticeStore, ttl: number, clockValue: clock.Clock): RegionalExitRuleNoticeStore {
  return new CachedRegionalExitRuleNoticeStore(
    inner,
    cache.newTtlCache<RegionalExitRuleNotice>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional exit rule notices. Empty fields match all. */
export class RegionalExitRuleNoticeQuery {
  locale: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minEndsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalExitRuleNotice): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalExitRuleNotice[]): RegionalExitRuleNotice[] {
    const matched = collections.filter(items, (candidate: RegionalExitRuleNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalExitRuleNotices(store: RegionalExitRuleNoticeStore, query: RegionalExitRuleNoticeQuery): RegionalExitRuleNotice[] {
  return query.apply(store.list());
}
