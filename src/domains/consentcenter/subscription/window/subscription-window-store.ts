import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionWindow } from "./subscription-window.js";

/** Keeps subscription windows by code. */
export interface SubscriptionWindowStore {
  find(code: string): SubscriptionWindow | undefined;
  save(item: SubscriptionWindow): void;
  remove(code: string): boolean;
  list(): SubscriptionWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionWindowStore implements SubscriptionWindowStore {
  items: Map<string, SubscriptionWindow>;
  order: string[];

  constructor(items: Map<string, SubscriptionWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionWindow): void {
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

  list(): SubscriptionWindow[] {
    const out: SubscriptionWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionWindowStore(): SubscriptionWindowStore {
  return new MemorySubscriptionWindowStore(new Map<string, SubscriptionWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionWindowStore implements SubscriptionWindowStore {
  inner: SubscriptionWindowStore;
  cache: cache.TtlCache<SubscriptionWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionWindowStore,
    cacheValue: cache.TtlCache<SubscriptionWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionWindow | undefined {
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

  save(item: SubscriptionWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionWindow[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionWindowStore(inner: SubscriptionWindowStore, ttl: number, clockValue: clock.Clock): SubscriptionWindowStore {
  return new CachedSubscriptionWindowStore(inner, cache.newTtlCache<SubscriptionWindow>(512, ttl, clockValue), 0, 0);
}

/** Selects subscription windows. Empty fields match all. */
export class SubscriptionWindowQuery {
  label: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMargin: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionWindow): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionWindow[]): SubscriptionWindow[] {
    const matched = collections.filter(items, (candidate: SubscriptionWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionWindows(store: SubscriptionWindowStore, query: SubscriptionWindowQuery): SubscriptionWindow[] {
  return query.apply(store.list());
}
