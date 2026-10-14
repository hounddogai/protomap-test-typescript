import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientWaitMapping } from "./lenient-wait-mapping.js";

/** Keeps lenient wait mappings by code. */
export interface LenientWaitMappingStore {
  find(code: string): LenientWaitMapping | undefined;
  save(item: LenientWaitMapping): void;
  remove(code: string): boolean;
  list(): LenientWaitMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientWaitMappingStore implements LenientWaitMappingStore {
  items: Map<string, LenientWaitMapping>;
  order: string[];

  constructor(items: Map<string, LenientWaitMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientWaitMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientWaitMapping): void {
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

  list(): LenientWaitMapping[] {
    const out: LenientWaitMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientWaitMappingStore(): LenientWaitMappingStore {
  return new MemoryLenientWaitMappingStore(new Map<string, LenientWaitMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientWaitMappingStore implements LenientWaitMappingStore {
  inner: LenientWaitMappingStore;
  cache: cache.TtlCache<LenientWaitMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientWaitMappingStore,
    cacheValue: cache.TtlCache<LenientWaitMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientWaitMapping | undefined {
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

  save(item: LenientWaitMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientWaitMapping[] {
    return this.inner.list();
  }
}

export function newCachedLenientWaitMappingStore(inner: LenientWaitMappingStore, ttl: number, clockValue: clock.Clock): LenientWaitMappingStore {
  return new CachedLenientWaitMappingStore(inner, cache.newTtlCache<LenientWaitMapping>(512, ttl, clockValue), 0, 0);
}

/** Selects lenient wait mappings. Empty fields match all. */
export class LenientWaitMappingQuery {
  utmSource: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minSendAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientWaitMapping): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientWaitMapping[]): LenientWaitMapping[] {
    const matched = collections.filter(items, (candidate: LenientWaitMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientWaitMappings(store: LenientWaitMappingStore, query: LenientWaitMappingQuery): LenientWaitMapping[] {
  return query.apply(store.list());
}
