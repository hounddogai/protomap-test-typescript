import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingFraudCheckException } from "./pending-fraud-check-exception.js";

/** Keeps pending fraud check exceptions by code. */
export interface PendingFraudCheckExceptionStore {
  find(code: string): PendingFraudCheckException | undefined;
  save(item: PendingFraudCheckException): void;
  remove(code: string): boolean;
  list(): PendingFraudCheckException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingFraudCheckExceptionStore implements PendingFraudCheckExceptionStore {
  items: Map<string, PendingFraudCheckException>;
  order: string[];

  constructor(items: Map<string, PendingFraudCheckException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingFraudCheckException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingFraudCheckException): void {
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

  list(): PendingFraudCheckException[] {
    const out: PendingFraudCheckException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingFraudCheckExceptionStore(): PendingFraudCheckExceptionStore {
  return new MemoryPendingFraudCheckExceptionStore(new Map<string, PendingFraudCheckException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingFraudCheckExceptionStore implements PendingFraudCheckExceptionStore {
  inner: PendingFraudCheckExceptionStore;
  cache: cache.TtlCache<PendingFraudCheckException>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingFraudCheckExceptionStore,
    cacheValue: cache.TtlCache<PendingFraudCheckException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingFraudCheckException | undefined {
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

  save(item: PendingFraudCheckException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingFraudCheckException[] {
    return this.inner.list();
  }
}

export function newCachedPendingFraudCheckExceptionStore(inner: PendingFraudCheckExceptionStore, ttl: number, clockValue: clock.Clock): PendingFraudCheckExceptionStore {
  return new CachedPendingFraudCheckExceptionStore(
    inner,
    cache.newTtlCache<PendingFraudCheckException>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending fraud check exceptions. Empty fields match all. */
export class PendingFraudCheckExceptionQuery {
  utmSource: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minBid: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingFraudCheckException): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingFraudCheckException[]): PendingFraudCheckException[] {
    const matched = collections.filter(items, (candidate: PendingFraudCheckException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingFraudCheckExceptions(store: PendingFraudCheckExceptionStore, query: PendingFraudCheckExceptionQuery): PendingFraudCheckException[] {
  return query.apply(store.list());
}
