import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionRequest } from "./conversion-request.js";

/** Keeps conversion requests by code. */
export interface ConversionRequestStore {
  find(code: string): ConversionRequest | undefined;
  save(item: ConversionRequest): void;
  remove(code: string): boolean;
  list(): ConversionRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionRequestStore implements ConversionRequestStore {
  items: Map<string, ConversionRequest>;
  order: string[];

  constructor(items: Map<string, ConversionRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionRequest): void {
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

  list(): ConversionRequest[] {
    const out: ConversionRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionRequestStore(): ConversionRequestStore {
  return new MemoryConversionRequestStore(new Map<string, ConversionRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionRequestStore implements ConversionRequestStore {
  inner: ConversionRequestStore;
  cache: cache.TtlCache<ConversionRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionRequestStore,
    cacheValue: cache.TtlCache<ConversionRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionRequest | undefined {
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

  save(item: ConversionRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionRequest[] {
    return this.inner.list();
  }
}

export function newCachedConversionRequestStore(inner: ConversionRequestStore, ttl: number, clockValue: clock.Clock): ConversionRequestStore {
  return new CachedConversionRequestStore(inner, cache.newTtlCache<ConversionRequest>(512, ttl, clockValue), 0, 0);
}

/** Selects conversion requests. Empty fields match all. */
export class ConversionRequestQuery {
  label: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRevision: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionRequest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionRequest[]): ConversionRequest[] {
    const matched = collections.filter(items, (candidate: ConversionRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionRequests(store: ConversionRequestStore, query: ConversionRequestQuery): ConversionRequest[] {
  return query.apply(store.list());
}
