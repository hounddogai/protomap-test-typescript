import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionWindow } from "./redemption-window.js";

/** Keeps redemption windows by code. */
export interface RedemptionWindowStore {
  find(code: string): RedemptionWindow | undefined;
  save(item: RedemptionWindow): void;
  remove(code: string): boolean;
  list(): RedemptionWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionWindowStore implements RedemptionWindowStore {
  items: Map<string, RedemptionWindow>;
  order: string[];

  constructor(items: Map<string, RedemptionWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionWindow): void {
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

  list(): RedemptionWindow[] {
    const out: RedemptionWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionWindowStore(): RedemptionWindowStore {
  return new MemoryRedemptionWindowStore(new Map<string, RedemptionWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionWindowStore implements RedemptionWindowStore {
  inner: RedemptionWindowStore;
  cache: cache.TtlCache<RedemptionWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionWindowStore,
    cacheValue: cache.TtlCache<RedemptionWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionWindow | undefined {
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

  save(item: RedemptionWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionWindow[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionWindowStore(inner: RedemptionWindowStore, ttl: number, clockValue: clock.Clock): RedemptionWindowStore {
  return new CachedRedemptionWindowStore(inner, cache.newTtlCache<RedemptionWindow>(128, ttl, clockValue), 0, 0);
}

/** Selects redemption windows. Empty fields match all. */
export class RedemptionWindowQuery {
  country: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.country = country;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionWindow): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionWindow[]): RedemptionWindow[] {
    const matched = collections.filter(items, (candidate: RedemptionWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionWindows(store: RedemptionWindowStore, query: RedemptionWindowQuery): RedemptionWindow[] {
  return query.apply(store.list());
}
