import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredOptOutWindow } from "./tiered-opt-out-window.js";

/** Keeps tiered opt out windows by code. */
export interface TieredOptOutWindowStore {
  find(code: string): TieredOptOutWindow | undefined;
  save(item: TieredOptOutWindow): void;
  remove(code: string): boolean;
  list(): TieredOptOutWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredOptOutWindowStore implements TieredOptOutWindowStore {
  items: Map<string, TieredOptOutWindow>;
  order: string[];

  constructor(items: Map<string, TieredOptOutWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredOptOutWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredOptOutWindow): void {
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

  list(): TieredOptOutWindow[] {
    const out: TieredOptOutWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredOptOutWindowStore(): TieredOptOutWindowStore {
  return new MemoryTieredOptOutWindowStore(new Map<string, TieredOptOutWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredOptOutWindowStore implements TieredOptOutWindowStore {
  inner: TieredOptOutWindowStore;
  cache: cache.TtlCache<TieredOptOutWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredOptOutWindowStore,
    cacheValue: cache.TtlCache<TieredOptOutWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredOptOutWindow | undefined {
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

  save(item: TieredOptOutWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredOptOutWindow[] {
    return this.inner.list();
  }
}

export function newCachedTieredOptOutWindowStore(inner: TieredOptOutWindowStore, ttl: number, clockValue: clock.Clock): TieredOptOutWindowStore {
  return new CachedTieredOptOutWindowStore(inner, cache.newTtlCache<TieredOptOutWindow>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered opt out windows. Empty fields match all. */
export class TieredOptOutWindowQuery {
  channel: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRatio: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredOptOutWindow): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredOptOutWindow[]): TieredOptOutWindow[] {
    const matched = collections.filter(items, (candidate: TieredOptOutWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredOptOutWindows(store: TieredOptOutWindowStore, query: TieredOptOutWindowQuery): TieredOptOutWindow[] {
  return query.apply(store.list());
}
