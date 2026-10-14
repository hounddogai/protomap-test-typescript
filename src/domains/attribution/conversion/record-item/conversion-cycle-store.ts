import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionCycle } from "./conversion-cycle.js";

/** Keeps conversion cycles by code. */
export interface ConversionCycleStore {
  find(code: string): ConversionCycle | undefined;
  save(item: ConversionCycle): void;
  remove(code: string): boolean;
  list(): ConversionCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionCycleStore implements ConversionCycleStore {
  items: Map<string, ConversionCycle>;
  order: string[];

  constructor(items: Map<string, ConversionCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionCycle): void {
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

  list(): ConversionCycle[] {
    const out: ConversionCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionCycleStore(): ConversionCycleStore {
  return new MemoryConversionCycleStore(new Map<string, ConversionCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionCycleStore implements ConversionCycleStore {
  inner: ConversionCycleStore;
  cache: cache.TtlCache<ConversionCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionCycleStore,
    cacheValue: cache.TtlCache<ConversionCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionCycle | undefined {
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

  save(item: ConversionCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionCycle[] {
    return this.inner.list();
  }
}

export function newCachedConversionCycleStore(inner: ConversionCycleStore, ttl: number, clockValue: clock.Clock): ConversionCycleStore {
  return new CachedConversionCycleStore(inner, cache.newTtlCache<ConversionCycle>(1024, ttl, clockValue), 0, 0);
}

/** Selects conversion cycles. Empty fields match all. */
export class ConversionCycleQuery {
  segment: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minThreshold: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionCycle): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionCycle[]): ConversionCycle[] {
    const matched = collections.filter(items, (candidate: ConversionCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionCycles(store: ConversionCycleStore, query: ConversionCycleQuery): ConversionCycle[] {
  return query.apply(store.list());
}
