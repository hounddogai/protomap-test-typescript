import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictSubscriptionWindow } from "./strict-subscription-window.js";

/** Keeps strict subscription windows by code. */
export interface StrictSubscriptionWindowStore {
  find(code: string): StrictSubscriptionWindow | undefined;
  save(item: StrictSubscriptionWindow): void;
  remove(code: string): boolean;
  list(): StrictSubscriptionWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictSubscriptionWindowStore implements StrictSubscriptionWindowStore {
  items: Map<string, StrictSubscriptionWindow>;
  order: string[];

  constructor(items: Map<string, StrictSubscriptionWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictSubscriptionWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictSubscriptionWindow): void {
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

  list(): StrictSubscriptionWindow[] {
    const out: StrictSubscriptionWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictSubscriptionWindowStore(): StrictSubscriptionWindowStore {
  return new MemoryStrictSubscriptionWindowStore(new Map<string, StrictSubscriptionWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictSubscriptionWindowStore implements StrictSubscriptionWindowStore {
  inner: StrictSubscriptionWindowStore;
  cache: cache.TtlCache<StrictSubscriptionWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictSubscriptionWindowStore,
    cacheValue: cache.TtlCache<StrictSubscriptionWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictSubscriptionWindow | undefined {
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

  save(item: StrictSubscriptionWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictSubscriptionWindow[] {
    return this.inner.list();
  }
}

export function newCachedStrictSubscriptionWindowStore(inner: StrictSubscriptionWindowStore, ttl: number, clockValue: clock.Clock): StrictSubscriptionWindowStore {
  return new CachedStrictSubscriptionWindowStore(
    inner,
    cache.newTtlCache<StrictSubscriptionWindow>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict subscription windows. Empty fields match all. */
export class StrictSubscriptionWindowQuery {
  country: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.country = country;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictSubscriptionWindow): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictSubscriptionWindow[]): StrictSubscriptionWindow[] {
    const matched = collections.filter(items, (candidate: StrictSubscriptionWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictSubscriptionWindows(store: StrictSubscriptionWindowStore, query: StrictSubscriptionWindowQuery): StrictSubscriptionWindow[] {
  return query.apply(store.list());
}
