import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictRedemptionException } from "./strict-redemption-exception.js";

/** Keeps strict redemption exceptions by code. */
export interface StrictRedemptionExceptionStore {
  find(code: string): StrictRedemptionException | undefined;
  save(item: StrictRedemptionException): void;
  remove(code: string): boolean;
  list(): StrictRedemptionException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictRedemptionExceptionStore implements StrictRedemptionExceptionStore {
  items: Map<string, StrictRedemptionException>;
  order: string[];

  constructor(items: Map<string, StrictRedemptionException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictRedemptionException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictRedemptionException): void {
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

  list(): StrictRedemptionException[] {
    const out: StrictRedemptionException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictRedemptionExceptionStore(): StrictRedemptionExceptionStore {
  return new MemoryStrictRedemptionExceptionStore(new Map<string, StrictRedemptionException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictRedemptionExceptionStore implements StrictRedemptionExceptionStore {
  inner: StrictRedemptionExceptionStore;
  cache: cache.TtlCache<StrictRedemptionException>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictRedemptionExceptionStore,
    cacheValue: cache.TtlCache<StrictRedemptionException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictRedemptionException | undefined {
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

  save(item: StrictRedemptionException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictRedemptionException[] {
    return this.inner.list();
  }
}

export function newCachedStrictRedemptionExceptionStore(inner: StrictRedemptionExceptionStore, ttl: number, clockValue: clock.Clock): StrictRedemptionExceptionStore {
  return new CachedStrictRedemptionExceptionStore(
    inner,
    cache.newTtlCache<StrictRedemptionException>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict redemption exceptions. Empty fields match all. */
export class StrictRedemptionExceptionQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictRedemptionException): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictRedemptionException[]): StrictRedemptionException[] {
    const matched = collections.filter(items, (candidate: StrictRedemptionException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictRedemptionExceptions(store: StrictRedemptionExceptionStore, query: StrictRedemptionExceptionQuery): StrictRedemptionException[] {
  return query.apply(store.list());
}
