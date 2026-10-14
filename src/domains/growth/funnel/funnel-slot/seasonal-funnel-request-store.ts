import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalFunnelRequest } from "./seasonal-funnel-request.js";

/** Keeps seasonal funnel requests by code. */
export interface SeasonalFunnelRequestStore {
  find(code: string): SeasonalFunnelRequest | undefined;
  save(item: SeasonalFunnelRequest): void;
  remove(code: string): boolean;
  list(): SeasonalFunnelRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalFunnelRequestStore implements SeasonalFunnelRequestStore {
  items: Map<string, SeasonalFunnelRequest>;
  order: string[];

  constructor(items: Map<string, SeasonalFunnelRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalFunnelRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalFunnelRequest): void {
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

  list(): SeasonalFunnelRequest[] {
    const out: SeasonalFunnelRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalFunnelRequestStore(): SeasonalFunnelRequestStore {
  return new MemorySeasonalFunnelRequestStore(new Map<string, SeasonalFunnelRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalFunnelRequestStore implements SeasonalFunnelRequestStore {
  inner: SeasonalFunnelRequestStore;
  cache: cache.TtlCache<SeasonalFunnelRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalFunnelRequestStore,
    cacheValue: cache.TtlCache<SeasonalFunnelRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalFunnelRequest | undefined {
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

  save(item: SeasonalFunnelRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalFunnelRequest[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalFunnelRequestStore(inner: SeasonalFunnelRequestStore, ttl: number, clockValue: clock.Clock): SeasonalFunnelRequestStore {
  return new CachedSeasonalFunnelRequestStore(
    inner,
    cache.newTtlCache<SeasonalFunnelRequest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal funnel requests. Empty fields match all. */
export class SeasonalFunnelRequestQuery {
  locale: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalFunnelRequest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalFunnelRequest[]): SeasonalFunnelRequest[] {
    const matched = collections.filter(items, (candidate: SeasonalFunnelRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalFunnelRequests(store: SeasonalFunnelRequestStore, query: SeasonalFunnelRequestQuery): SeasonalFunnelRequest[] {
  return query.apply(store.list());
}
