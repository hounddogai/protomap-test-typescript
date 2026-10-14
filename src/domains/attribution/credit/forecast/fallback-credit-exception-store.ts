import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackCreditException } from "./fallback-credit-exception.js";

/** Keeps fallback credit exceptions by code. */
export interface FallbackCreditExceptionStore {
  find(code: string): FallbackCreditException | undefined;
  save(item: FallbackCreditException): void;
  remove(code: string): boolean;
  list(): FallbackCreditException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackCreditExceptionStore implements FallbackCreditExceptionStore {
  items: Map<string, FallbackCreditException>;
  order: string[];

  constructor(items: Map<string, FallbackCreditException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackCreditException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackCreditException): void {
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

  list(): FallbackCreditException[] {
    const out: FallbackCreditException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackCreditExceptionStore(): FallbackCreditExceptionStore {
  return new MemoryFallbackCreditExceptionStore(new Map<string, FallbackCreditException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackCreditExceptionStore implements FallbackCreditExceptionStore {
  inner: FallbackCreditExceptionStore;
  cache: cache.TtlCache<FallbackCreditException>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackCreditExceptionStore,
    cacheValue: cache.TtlCache<FallbackCreditException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackCreditException | undefined {
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

  save(item: FallbackCreditException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackCreditException[] {
    return this.inner.list();
  }
}

export function newCachedFallbackCreditExceptionStore(inner: FallbackCreditExceptionStore, ttl: number, clockValue: clock.Clock): FallbackCreditExceptionStore {
  return new CachedFallbackCreditExceptionStore(
    inner,
    cache.newTtlCache<FallbackCreditException>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback credit exceptions. Empty fields match all. */
export class FallbackCreditExceptionQuery {
  locale: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAttempts: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackCreditException): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackCreditException[]): FallbackCreditException[] {
    const matched = collections.filter(items, (candidate: FallbackCreditException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackCreditExceptions(store: FallbackCreditExceptionStore, query: FallbackCreditExceptionQuery): FallbackCreditException[] {
  return query.apply(store.list());
}
