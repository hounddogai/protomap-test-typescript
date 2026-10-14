import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredActivationWindow } from "./tiered-activation-window.js";

/** Keeps tiered activation windows by code. */
export interface TieredActivationWindowStore {
  find(code: string): TieredActivationWindow | undefined;
  save(item: TieredActivationWindow): void;
  remove(code: string): boolean;
  list(): TieredActivationWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredActivationWindowStore implements TieredActivationWindowStore {
  items: Map<string, TieredActivationWindow>;
  order: string[];

  constructor(items: Map<string, TieredActivationWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredActivationWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredActivationWindow): void {
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

  list(): TieredActivationWindow[] {
    const out: TieredActivationWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredActivationWindowStore(): TieredActivationWindowStore {
  return new MemoryTieredActivationWindowStore(new Map<string, TieredActivationWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredActivationWindowStore implements TieredActivationWindowStore {
  inner: TieredActivationWindowStore;
  cache: cache.TtlCache<TieredActivationWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredActivationWindowStore,
    cacheValue: cache.TtlCache<TieredActivationWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredActivationWindow | undefined {
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

  save(item: TieredActivationWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredActivationWindow[] {
    return this.inner.list();
  }
}

export function newCachedTieredActivationWindowStore(inner: TieredActivationWindowStore, ttl: number, clockValue: clock.Clock): TieredActivationWindowStore {
  return new CachedTieredActivationWindowStore(
    inner,
    cache.newTtlCache<TieredActivationWindow>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered activation windows. Empty fields match all. */
export class TieredActivationWindowQuery {
  locale: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredActivationWindow): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredActivationWindow[]): TieredActivationWindow[] {
    const matched = collections.filter(items, (candidate: TieredActivationWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredActivationWindows(store: TieredActivationWindowStore, query: TieredActivationWindowQuery): TieredActivationWindow[] {
  return query.apply(store.list());
}
