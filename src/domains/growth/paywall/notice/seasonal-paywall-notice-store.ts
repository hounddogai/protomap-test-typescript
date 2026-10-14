import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalPaywallNotice } from "./seasonal-paywall-notice.js";

/** Keeps seasonal paywall notices by code. */
export interface SeasonalPaywallNoticeStore {
  find(code: string): SeasonalPaywallNotice | undefined;
  save(item: SeasonalPaywallNotice): void;
  remove(code: string): boolean;
  list(): SeasonalPaywallNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalPaywallNoticeStore implements SeasonalPaywallNoticeStore {
  items: Map<string, SeasonalPaywallNotice>;
  order: string[];

  constructor(items: Map<string, SeasonalPaywallNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalPaywallNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalPaywallNotice): void {
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

  list(): SeasonalPaywallNotice[] {
    const out: SeasonalPaywallNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalPaywallNoticeStore(): SeasonalPaywallNoticeStore {
  return new MemorySeasonalPaywallNoticeStore(new Map<string, SeasonalPaywallNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalPaywallNoticeStore implements SeasonalPaywallNoticeStore {
  inner: SeasonalPaywallNoticeStore;
  cache: cache.TtlCache<SeasonalPaywallNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalPaywallNoticeStore,
    cacheValue: cache.TtlCache<SeasonalPaywallNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalPaywallNotice | undefined {
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

  save(item: SeasonalPaywallNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalPaywallNotice[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalPaywallNoticeStore(inner: SeasonalPaywallNoticeStore, ttl: number, clockValue: clock.Clock): SeasonalPaywallNoticeStore {
  return new CachedSeasonalPaywallNoticeStore(
    inner,
    cache.newTtlCache<SeasonalPaywallNotice>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal paywall notices. Empty fields match all. */
export class SeasonalPaywallNoticeQuery {
  region: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMinimum: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalPaywallNotice): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalPaywallNotice[]): SeasonalPaywallNotice[] {
    const matched = collections.filter(items, (candidate: SeasonalPaywallNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalPaywallNotices(store: SeasonalPaywallNoticeStore, query: SeasonalPaywallNoticeQuery): SeasonalPaywallNotice[] {
  return query.apply(store.list());
}
