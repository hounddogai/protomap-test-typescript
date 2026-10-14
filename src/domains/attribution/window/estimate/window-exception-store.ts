import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowException } from "./window-exception.js";

/** Keeps window exceptions by code. */
export interface WindowExceptionStore {
  find(code: string): WindowException | undefined;
  save(item: WindowException): void;
  remove(code: string): boolean;
  list(): WindowException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowExceptionStore implements WindowExceptionStore {
  items: Map<string, WindowException>;
  order: string[];

  constructor(items: Map<string, WindowException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowException): void {
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

  list(): WindowException[] {
    const out: WindowException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowExceptionStore(): WindowExceptionStore {
  return new MemoryWindowExceptionStore(new Map<string, WindowException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowExceptionStore implements WindowExceptionStore {
  inner: WindowExceptionStore;
  cache: cache.TtlCache<WindowException>;
  hits: number;
  misses: number;

  constructor(
    inner: WindowExceptionStore,
    cacheValue: cache.TtlCache<WindowException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowException | undefined {
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

  save(item: WindowException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowException[] {
    return this.inner.list();
  }
}

export function newCachedWindowExceptionStore(inner: WindowExceptionStore, ttl: number, clockValue: clock.Clock): WindowExceptionStore {
  return new CachedWindowExceptionStore(inner, cache.newTtlCache<WindowException>(128, ttl, clockValue), 0, 0);
}

/** Selects window exceptions. Empty fields match all. */
export class WindowExceptionQuery {
  locale: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMinimum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowException): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowException[]): WindowException[] {
    const matched = collections.filter(items, (candidate: WindowException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowExceptions(store: WindowExceptionStore, query: WindowExceptionQuery): WindowException[] {
  return query.apply(store.list());
}
