import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedFraudCheckException } from "./capped-fraud-check-exception.js";

/** Keeps capped fraud check exceptions by code. */
export interface CappedFraudCheckExceptionStore {
  find(code: string): CappedFraudCheckException | undefined;
  save(item: CappedFraudCheckException): void;
  remove(code: string): boolean;
  list(): CappedFraudCheckException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedFraudCheckExceptionStore implements CappedFraudCheckExceptionStore {
  items: Map<string, CappedFraudCheckException>;
  order: string[];

  constructor(items: Map<string, CappedFraudCheckException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedFraudCheckException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedFraudCheckException): void {
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

  list(): CappedFraudCheckException[] {
    const out: CappedFraudCheckException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedFraudCheckExceptionStore(): CappedFraudCheckExceptionStore {
  return new MemoryCappedFraudCheckExceptionStore(new Map<string, CappedFraudCheckException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedFraudCheckExceptionStore implements CappedFraudCheckExceptionStore {
  inner: CappedFraudCheckExceptionStore;
  cache: cache.TtlCache<CappedFraudCheckException>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedFraudCheckExceptionStore,
    cacheValue: cache.TtlCache<CappedFraudCheckException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedFraudCheckException | undefined {
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

  save(item: CappedFraudCheckException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedFraudCheckException[] {
    return this.inner.list();
  }
}

export function newCachedCappedFraudCheckExceptionStore(inner: CappedFraudCheckExceptionStore, ttl: number, clockValue: clock.Clock): CappedFraudCheckExceptionStore {
  return new CachedCappedFraudCheckExceptionStore(
    inner,
    cache.newTtlCache<CappedFraudCheckException>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped fraud check exceptions. Empty fields match all. */
export class CappedFraudCheckExceptionQuery {
  region: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minScore: number, statuses: string[], limit: number) {
    this.region = region;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedFraudCheckException): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedFraudCheckException[]): CappedFraudCheckException[] {
    const matched = collections.filter(items, (candidate: CappedFraudCheckException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedFraudCheckExceptions(store: CappedFraudCheckExceptionStore, query: CappedFraudCheckExceptionQuery): CappedFraudCheckException[] {
  return query.apply(store.list());
}
