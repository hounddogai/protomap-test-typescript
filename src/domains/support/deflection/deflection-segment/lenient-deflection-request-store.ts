import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientDeflectionRequest } from "./lenient-deflection-request.js";

/** Keeps lenient deflection requests by code. */
export interface LenientDeflectionRequestStore {
  find(code: string): LenientDeflectionRequest | undefined;
  save(item: LenientDeflectionRequest): void;
  remove(code: string): boolean;
  list(): LenientDeflectionRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientDeflectionRequestStore implements LenientDeflectionRequestStore {
  items: Map<string, LenientDeflectionRequest>;
  order: string[];

  constructor(items: Map<string, LenientDeflectionRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientDeflectionRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientDeflectionRequest): void {
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

  list(): LenientDeflectionRequest[] {
    const out: LenientDeflectionRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientDeflectionRequestStore(): LenientDeflectionRequestStore {
  return new MemoryLenientDeflectionRequestStore(new Map<string, LenientDeflectionRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientDeflectionRequestStore implements LenientDeflectionRequestStore {
  inner: LenientDeflectionRequestStore;
  cache: cache.TtlCache<LenientDeflectionRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientDeflectionRequestStore,
    cacheValue: cache.TtlCache<LenientDeflectionRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientDeflectionRequest | undefined {
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

  save(item: LenientDeflectionRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientDeflectionRequest[] {
    return this.inner.list();
  }
}

export function newCachedLenientDeflectionRequestStore(inner: LenientDeflectionRequestStore, ttl: number, clockValue: clock.Clock): LenientDeflectionRequestStore {
  return new CachedLenientDeflectionRequestStore(
    inner,
    cache.newTtlCache<LenientDeflectionRequest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient deflection requests. Empty fields match all. */
export class LenientDeflectionRequestQuery {
  utmSource: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minAmount: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientDeflectionRequest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientDeflectionRequest[]): LenientDeflectionRequest[] {
    const matched = collections.filter(items, (candidate: LenientDeflectionRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientDeflectionRequests(store: LenientDeflectionRequestStore, query: LenientDeflectionRequestQuery): LenientDeflectionRequest[] {
  return query.apply(store.list());
}
