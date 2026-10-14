import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionException } from "./conversion-exception.js";

/** Keeps conversion exceptions by code. */
export interface ConversionExceptionStore {
  find(code: string): ConversionException | undefined;
  save(item: ConversionException): void;
  remove(code: string): boolean;
  list(): ConversionException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionExceptionStore implements ConversionExceptionStore {
  items: Map<string, ConversionException>;
  order: string[];

  constructor(items: Map<string, ConversionException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionException): void {
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

  list(): ConversionException[] {
    const out: ConversionException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionExceptionStore(): ConversionExceptionStore {
  return new MemoryConversionExceptionStore(new Map<string, ConversionException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionExceptionStore implements ConversionExceptionStore {
  inner: ConversionExceptionStore;
  cache: cache.TtlCache<ConversionException>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionExceptionStore,
    cacheValue: cache.TtlCache<ConversionException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionException | undefined {
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

  save(item: ConversionException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionException[] {
    return this.inner.list();
  }
}

export function newCachedConversionExceptionStore(inner: ConversionExceptionStore, ttl: number, clockValue: clock.Clock): ConversionExceptionStore {
  return new CachedConversionExceptionStore(inner, cache.newTtlCache<ConversionException>(256, ttl, clockValue), 0, 0);
}

/** Selects conversion exceptions. Empty fields match all. */
export class ConversionExceptionQuery {
  segment: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minScore: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionException): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionException[]): ConversionException[] {
    const matched = collections.filter(items, (candidate: ConversionException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionExceptions(store: ConversionExceptionStore, query: ConversionExceptionQuery): ConversionException[] {
  return query.apply(store.list());
}
