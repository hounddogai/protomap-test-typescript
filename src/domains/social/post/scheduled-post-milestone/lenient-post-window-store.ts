import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPostWindow } from "./lenient-post-window.js";

/** Keeps lenient post windows by code. */
export interface LenientPostWindowStore {
  find(code: string): LenientPostWindow | undefined;
  save(item: LenientPostWindow): void;
  remove(code: string): boolean;
  list(): LenientPostWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPostWindowStore implements LenientPostWindowStore {
  items: Map<string, LenientPostWindow>;
  order: string[];

  constructor(items: Map<string, LenientPostWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPostWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPostWindow): void {
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

  list(): LenientPostWindow[] {
    const out: LenientPostWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPostWindowStore(): LenientPostWindowStore {
  return new MemoryLenientPostWindowStore(new Map<string, LenientPostWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPostWindowStore implements LenientPostWindowStore {
  inner: LenientPostWindowStore;
  cache: cache.TtlCache<LenientPostWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPostWindowStore,
    cacheValue: cache.TtlCache<LenientPostWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPostWindow | undefined {
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

  save(item: LenientPostWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPostWindow[] {
    return this.inner.list();
  }
}

export function newCachedLenientPostWindowStore(inner: LenientPostWindowStore, ttl: number, clockValue: clock.Clock): LenientPostWindowStore {
  return new CachedLenientPostWindowStore(inner, cache.newTtlCache<LenientPostWindow>(128, ttl, clockValue), 0, 0);
}

/** Selects lenient post windows. Empty fields match all. */
export class LenientPostWindowQuery {
  locale: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minStartsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPostWindow): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPostWindow[]): LenientPostWindow[] {
    const matched = collections.filter(items, (candidate: LenientPostWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPostWindows(store: LenientPostWindowStore, query: LenientPostWindowQuery): LenientPostWindow[] {
  return query.apply(store.list());
}
