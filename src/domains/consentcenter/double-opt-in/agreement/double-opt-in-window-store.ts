import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInWindow } from "./double-opt-in-window.js";

/** Keeps double opt in windows by code. */
export interface DoubleOptInWindowStore {
  find(code: string): DoubleOptInWindow | undefined;
  save(item: DoubleOptInWindow): void;
  remove(code: string): boolean;
  list(): DoubleOptInWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInWindowStore implements DoubleOptInWindowStore {
  items: Map<string, DoubleOptInWindow>;
  order: string[];

  constructor(items: Map<string, DoubleOptInWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInWindow): void {
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

  list(): DoubleOptInWindow[] {
    const out: DoubleOptInWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInWindowStore(): DoubleOptInWindowStore {
  return new MemoryDoubleOptInWindowStore(new Map<string, DoubleOptInWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInWindowStore implements DoubleOptInWindowStore {
  inner: DoubleOptInWindowStore;
  cache: cache.TtlCache<DoubleOptInWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInWindowStore,
    cacheValue: cache.TtlCache<DoubleOptInWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInWindow | undefined {
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

  save(item: DoubleOptInWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInWindow[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInWindowStore(inner: DoubleOptInWindowStore, ttl: number, clockValue: clock.Clock): DoubleOptInWindowStore {
  return new CachedDoubleOptInWindowStore(inner, cache.newTtlCache<DoubleOptInWindow>(64, ttl, clockValue), 0, 0);
}

/** Selects double opt in windows. Empty fields match all. */
export class DoubleOptInWindowQuery {
  title: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minVersion: number, statuses: string[], limit: number) {
    this.title = title;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInWindow): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInWindow[]): DoubleOptInWindow[] {
    const matched = collections.filter(items, (candidate: DoubleOptInWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInWindows(store: DoubleOptInWindowStore, query: DoubleOptInWindowQuery): DoubleOptInWindow[] {
  return query.apply(store.list());
}
