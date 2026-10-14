import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutWindow } from "./opt-out-window.js";

/** Keeps opt out windows by code. */
export interface OptOutWindowStore {
  find(code: string): OptOutWindow | undefined;
  save(item: OptOutWindow): void;
  remove(code: string): boolean;
  list(): OptOutWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutWindowStore implements OptOutWindowStore {
  items: Map<string, OptOutWindow>;
  order: string[];

  constructor(items: Map<string, OptOutWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutWindow): void {
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

  list(): OptOutWindow[] {
    const out: OptOutWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutWindowStore(): OptOutWindowStore {
  return new MemoryOptOutWindowStore(new Map<string, OptOutWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutWindowStore implements OptOutWindowStore {
  inner: OptOutWindowStore;
  cache: cache.TtlCache<OptOutWindow>;
  hits: number;
  misses: number;

  constructor(inner: OptOutWindowStore, cacheValue: cache.TtlCache<OptOutWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutWindow | undefined {
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

  save(item: OptOutWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutWindow[] {
    return this.inner.list();
  }
}

export function newCachedOptOutWindowStore(inner: OptOutWindowStore, ttl: number, clockValue: clock.Clock): OptOutWindowStore {
  return new CachedOptOutWindowStore(inner, cache.newTtlCache<OptOutWindow>(128, ttl, clockValue), 0, 0);
}

/** Selects opt out windows. Empty fields match all. */
export class OptOutWindowQuery {
  utmSource: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCeiling: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutWindow): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutWindow[]): OptOutWindow[] {
    const matched = collections.filter(items, (candidate: OptOutWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutWindows(store: OptOutWindowStore, query: OptOutWindowQuery): OptOutWindow[] {
  return query.apply(store.list());
}
