import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictInsightRequest } from "./strict-insight-request.js";

/** Keeps strict insight requests by code. */
export interface StrictInsightRequestStore {
  find(code: string): StrictInsightRequest | undefined;
  save(item: StrictInsightRequest): void;
  remove(code: string): boolean;
  list(): StrictInsightRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictInsightRequestStore implements StrictInsightRequestStore {
  items: Map<string, StrictInsightRequest>;
  order: string[];

  constructor(items: Map<string, StrictInsightRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictInsightRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictInsightRequest): void {
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

  list(): StrictInsightRequest[] {
    const out: StrictInsightRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictInsightRequestStore(): StrictInsightRequestStore {
  return new MemoryStrictInsightRequestStore(new Map<string, StrictInsightRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictInsightRequestStore implements StrictInsightRequestStore {
  inner: StrictInsightRequestStore;
  cache: cache.TtlCache<StrictInsightRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictInsightRequestStore,
    cacheValue: cache.TtlCache<StrictInsightRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictInsightRequest | undefined {
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

  save(item: StrictInsightRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictInsightRequest[] {
    return this.inner.list();
  }
}

export function newCachedStrictInsightRequestStore(inner: StrictInsightRequestStore, ttl: number, clockValue: clock.Clock): StrictInsightRequestStore {
  return new CachedStrictInsightRequestStore(
    inner,
    cache.newTtlCache<StrictInsightRequest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict insight requests. Empty fields match all. */
export class StrictInsightRequestQuery {
  title: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictInsightRequest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictInsightRequest[]): StrictInsightRequest[] {
    const matched = collections.filter(items, (candidate: StrictInsightRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictInsightRequests(store: StrictInsightRequestStore, query: StrictInsightRequestQuery): StrictInsightRequest[] {
  return query.apply(store.list());
}
