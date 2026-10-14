import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackComplaintException } from "./fallback-complaint-exception.js";

/** Keeps fallback complaint exceptions by code. */
export interface FallbackComplaintExceptionStore {
  find(code: string): FallbackComplaintException | undefined;
  save(item: FallbackComplaintException): void;
  remove(code: string): boolean;
  list(): FallbackComplaintException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackComplaintExceptionStore implements FallbackComplaintExceptionStore {
  items: Map<string, FallbackComplaintException>;
  order: string[];

  constructor(items: Map<string, FallbackComplaintException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackComplaintException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackComplaintException): void {
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

  list(): FallbackComplaintException[] {
    const out: FallbackComplaintException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackComplaintExceptionStore(): FallbackComplaintExceptionStore {
  return new MemoryFallbackComplaintExceptionStore(new Map<string, FallbackComplaintException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackComplaintExceptionStore implements FallbackComplaintExceptionStore {
  inner: FallbackComplaintExceptionStore;
  cache: cache.TtlCache<FallbackComplaintException>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackComplaintExceptionStore,
    cacheValue: cache.TtlCache<FallbackComplaintException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackComplaintException | undefined {
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

  save(item: FallbackComplaintException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackComplaintException[] {
    return this.inner.list();
  }
}

export function newCachedFallbackComplaintExceptionStore(inner: FallbackComplaintExceptionStore, ttl: number, clockValue: clock.Clock): FallbackComplaintExceptionStore {
  return new CachedFallbackComplaintExceptionStore(
    inner,
    cache.newTtlCache<FallbackComplaintException>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback complaint exceptions. Empty fields match all. */
export class FallbackComplaintExceptionQuery {
  source: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackComplaintException): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackComplaintException[]): FallbackComplaintException[] {
    const matched = collections.filter(items, (candidate: FallbackComplaintException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackComplaintExceptions(store: FallbackComplaintExceptionStore, query: FallbackComplaintExceptionQuery): FallbackComplaintException[] {
  return query.apply(store.list());
}
