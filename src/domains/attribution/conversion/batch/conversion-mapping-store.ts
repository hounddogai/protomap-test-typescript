import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionMapping } from "./conversion-mapping.js";

/** Keeps conversion mappings by code. */
export interface ConversionMappingStore {
  find(code: string): ConversionMapping | undefined;
  save(item: ConversionMapping): void;
  remove(code: string): boolean;
  list(): ConversionMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionMappingStore implements ConversionMappingStore {
  items: Map<string, ConversionMapping>;
  order: string[];

  constructor(items: Map<string, ConversionMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionMapping): void {
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

  list(): ConversionMapping[] {
    const out: ConversionMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionMappingStore(): ConversionMappingStore {
  return new MemoryConversionMappingStore(new Map<string, ConversionMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionMappingStore implements ConversionMappingStore {
  inner: ConversionMappingStore;
  cache: cache.TtlCache<ConversionMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionMappingStore,
    cacheValue: cache.TtlCache<ConversionMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionMapping | undefined {
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

  save(item: ConversionMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionMapping[] {
    return this.inner.list();
  }
}

export function newCachedConversionMappingStore(inner: ConversionMappingStore, ttl: number, clockValue: clock.Clock): ConversionMappingStore {
  return new CachedConversionMappingStore(inner, cache.newTtlCache<ConversionMapping>(64, ttl, clockValue), 0, 0);
}

/** Selects conversion mappings. Empty fields match all. */
export class ConversionMappingQuery {
  channel: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRevision: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionMapping): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionMapping[]): ConversionMapping[] {
    const matched = collections.filter(items, (candidate: ConversionMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionMappings(store: ConversionMappingStore, query: ConversionMappingQuery): ConversionMapping[] {
  return query.apply(store.list());
}
