import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyWindow } from "./journey-window.js";

/** Keeps journey windows by code. */
export interface JourneyWindowStore {
  find(code: string): JourneyWindow | undefined;
  save(item: JourneyWindow): void;
  remove(code: string): boolean;
  list(): JourneyWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyWindowStore implements JourneyWindowStore {
  items: Map<string, JourneyWindow>;
  order: string[];

  constructor(items: Map<string, JourneyWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyWindow): void {
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

  list(): JourneyWindow[] {
    const out: JourneyWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyWindowStore(): JourneyWindowStore {
  return new MemoryJourneyWindowStore(new Map<string, JourneyWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyWindowStore implements JourneyWindowStore {
  inner: JourneyWindowStore;
  cache: cache.TtlCache<JourneyWindow>;
  hits: number;
  misses: number;

  constructor(inner: JourneyWindowStore, cacheValue: cache.TtlCache<JourneyWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyWindow | undefined {
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

  save(item: JourneyWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyWindow[] {
    return this.inner.list();
  }
}

export function newCachedJourneyWindowStore(inner: JourneyWindowStore, ttl: number, clockValue: clock.Clock): JourneyWindowStore {
  return new CachedJourneyWindowStore(inner, cache.newTtlCache<JourneyWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects journey windows. Empty fields match all. */
export class JourneyWindowQuery {
  unit: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMinimum: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyWindow): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyWindow[]): JourneyWindow[] {
    const matched = collections.filter(items, (candidate: JourneyWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyWindows(store: JourneyWindowStore, query: JourneyWindowQuery): JourneyWindow[] {
  return query.apply(store.list());
}
