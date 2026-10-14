import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionWindow } from "./conversion-window.js";

/** Keeps conversion windows by code. */
export interface ConversionWindowStore {
  find(code: string): ConversionWindow | undefined;
  save(item: ConversionWindow): void;
  remove(code: string): boolean;
  list(): ConversionWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionWindowStore implements ConversionWindowStore {
  items: Map<string, ConversionWindow>;
  order: string[];

  constructor(items: Map<string, ConversionWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionWindow): void {
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

  list(): ConversionWindow[] {
    const out: ConversionWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionWindowStore(): ConversionWindowStore {
  return new MemoryConversionWindowStore(new Map<string, ConversionWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionWindowStore implements ConversionWindowStore {
  inner: ConversionWindowStore;
  cache: cache.TtlCache<ConversionWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionWindowStore,
    cacheValue: cache.TtlCache<ConversionWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionWindow | undefined {
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

  save(item: ConversionWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionWindow[] {
    return this.inner.list();
  }
}

export function newCachedConversionWindowStore(inner: ConversionWindowStore, ttl: number, clockValue: clock.Clock): ConversionWindowStore {
  return new CachedConversionWindowStore(inner, cache.newTtlCache<ConversionWindow>(256, ttl, clockValue), 0, 0);
}

/** Selects conversion windows. Empty fields match all. */
export class ConversionWindowQuery {
  category: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minConversionRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionWindow): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionWindow[]): ConversionWindow[] {
    const matched = collections.filter(items, (candidate: ConversionWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionWindows(store: ConversionWindowStore, query: ConversionWindowQuery): ConversionWindow[] {
  return query.apply(store.list());
}
