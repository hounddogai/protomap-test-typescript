import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictRedemptionWindow } from "./strict-redemption-window.js";

/** Keeps strict redemption windows by code. */
export interface StrictRedemptionWindowStore {
  find(code: string): StrictRedemptionWindow | undefined;
  save(item: StrictRedemptionWindow): void;
  remove(code: string): boolean;
  list(): StrictRedemptionWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictRedemptionWindowStore implements StrictRedemptionWindowStore {
  items: Map<string, StrictRedemptionWindow>;
  order: string[];

  constructor(items: Map<string, StrictRedemptionWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictRedemptionWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictRedemptionWindow): void {
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

  list(): StrictRedemptionWindow[] {
    const out: StrictRedemptionWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictRedemptionWindowStore(): StrictRedemptionWindowStore {
  return new MemoryStrictRedemptionWindowStore(new Map<string, StrictRedemptionWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictRedemptionWindowStore implements StrictRedemptionWindowStore {
  inner: StrictRedemptionWindowStore;
  cache: cache.TtlCache<StrictRedemptionWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictRedemptionWindowStore,
    cacheValue: cache.TtlCache<StrictRedemptionWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictRedemptionWindow | undefined {
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

  save(item: StrictRedemptionWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictRedemptionWindow[] {
    return this.inner.list();
  }
}

export function newCachedStrictRedemptionWindowStore(inner: StrictRedemptionWindowStore, ttl: number, clockValue: clock.Clock): StrictRedemptionWindowStore {
  return new CachedStrictRedemptionWindowStore(
    inner,
    cache.newTtlCache<StrictRedemptionWindow>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict redemption windows. Empty fields match all. */
export class StrictRedemptionWindowQuery {
  title: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minThreshold: number, statuses: string[], limit: number) {
    this.title = title;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictRedemptionWindow): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictRedemptionWindow[]): StrictRedemptionWindow[] {
    const matched = collections.filter(items, (candidate: StrictRedemptionWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictRedemptionWindows(store: StrictRedemptionWindowStore, query: StrictRedemptionWindowQuery): StrictRedemptionWindow[] {
  return query.apply(store.list());
}
