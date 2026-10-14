import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionWindow } from "./suppression-window.js";

/** Keeps suppression windows by code. */
export interface SuppressionWindowStore {
  find(code: string): SuppressionWindow | undefined;
  save(item: SuppressionWindow): void;
  remove(code: string): boolean;
  list(): SuppressionWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionWindowStore implements SuppressionWindowStore {
  items: Map<string, SuppressionWindow>;
  order: string[];

  constructor(items: Map<string, SuppressionWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionWindow): void {
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

  list(): SuppressionWindow[] {
    const out: SuppressionWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionWindowStore(): SuppressionWindowStore {
  return new MemorySuppressionWindowStore(new Map<string, SuppressionWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionWindowStore implements SuppressionWindowStore {
  inner: SuppressionWindowStore;
  cache: cache.TtlCache<SuppressionWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionWindowStore,
    cacheValue: cache.TtlCache<SuppressionWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionWindow | undefined {
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

  save(item: SuppressionWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionWindow[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionWindowStore(inner: SuppressionWindowStore, ttl: number, clockValue: clock.Clock): SuppressionWindowStore {
  return new CachedSuppressionWindowStore(inner, cache.newTtlCache<SuppressionWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects suppression windows. Empty fields match all. */
export class SuppressionWindowQuery {
  locale: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWeight: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionWindow): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionWindow[]): SuppressionWindow[] {
    const matched = collections.filter(items, (candidate: SuppressionWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionWindows(store: SuppressionWindowStore, query: SuppressionWindowQuery): SuppressionWindow[] {
  return query.apply(store.list());
}
