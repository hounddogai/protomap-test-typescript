import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalJourneyRequest } from "./seasonal-journey-request.js";

/** Keeps seasonal journey requests by code. */
export interface SeasonalJourneyRequestStore {
  find(code: string): SeasonalJourneyRequest | undefined;
  save(item: SeasonalJourneyRequest): void;
  remove(code: string): boolean;
  list(): SeasonalJourneyRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalJourneyRequestStore implements SeasonalJourneyRequestStore {
  items: Map<string, SeasonalJourneyRequest>;
  order: string[];

  constructor(items: Map<string, SeasonalJourneyRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalJourneyRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalJourneyRequest): void {
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

  list(): SeasonalJourneyRequest[] {
    const out: SeasonalJourneyRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalJourneyRequestStore(): SeasonalJourneyRequestStore {
  return new MemorySeasonalJourneyRequestStore(new Map<string, SeasonalJourneyRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalJourneyRequestStore implements SeasonalJourneyRequestStore {
  inner: SeasonalJourneyRequestStore;
  cache: cache.TtlCache<SeasonalJourneyRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalJourneyRequestStore,
    cacheValue: cache.TtlCache<SeasonalJourneyRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalJourneyRequest | undefined {
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

  save(item: SeasonalJourneyRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalJourneyRequest[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalJourneyRequestStore(inner: SeasonalJourneyRequestStore, ttl: number, clockValue: clock.Clock): SeasonalJourneyRequestStore {
  return new CachedSeasonalJourneyRequestStore(
    inner,
    cache.newTtlCache<SeasonalJourneyRequest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal journey requests. Empty fields match all. */
export class SeasonalJourneyRequestQuery {
  source: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minMargin: number, statuses: string[], limit: number) {
    this.source = source;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalJourneyRequest): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalJourneyRequest[]): SeasonalJourneyRequest[] {
    const matched = collections.filter(items, (candidate: SeasonalJourneyRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalJourneyRequests(store: SeasonalJourneyRequestStore, query: SeasonalJourneyRequestQuery): SeasonalJourneyRequest[] {
  return query.apply(store.list());
}
