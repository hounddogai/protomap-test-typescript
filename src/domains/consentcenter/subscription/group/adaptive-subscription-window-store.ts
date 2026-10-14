import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveSubscriptionWindow } from "./adaptive-subscription-window.js";

/** Keeps adaptive subscription windows by code. */
export interface AdaptiveSubscriptionWindowStore {
  find(code: string): AdaptiveSubscriptionWindow | undefined;
  save(item: AdaptiveSubscriptionWindow): void;
  remove(code: string): boolean;
  list(): AdaptiveSubscriptionWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveSubscriptionWindowStore implements AdaptiveSubscriptionWindowStore {
  items: Map<string, AdaptiveSubscriptionWindow>;
  order: string[];

  constructor(items: Map<string, AdaptiveSubscriptionWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveSubscriptionWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveSubscriptionWindow): void {
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

  list(): AdaptiveSubscriptionWindow[] {
    const out: AdaptiveSubscriptionWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveSubscriptionWindowStore(): AdaptiveSubscriptionWindowStore {
  return new MemoryAdaptiveSubscriptionWindowStore(new Map<string, AdaptiveSubscriptionWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveSubscriptionWindowStore implements AdaptiveSubscriptionWindowStore {
  inner: AdaptiveSubscriptionWindowStore;
  cache: cache.TtlCache<AdaptiveSubscriptionWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveSubscriptionWindowStore,
    cacheValue: cache.TtlCache<AdaptiveSubscriptionWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveSubscriptionWindow | undefined {
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

  save(item: AdaptiveSubscriptionWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveSubscriptionWindow[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveSubscriptionWindowStore(inner: AdaptiveSubscriptionWindowStore, ttl: number, clockValue: clock.Clock): AdaptiveSubscriptionWindowStore {
  return new CachedAdaptiveSubscriptionWindowStore(
    inner,
    cache.newTtlCache<AdaptiveSubscriptionWindow>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive subscription windows. Empty fields match all. */
export class AdaptiveSubscriptionWindowQuery {
  title: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.title = title;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveSubscriptionWindow): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveSubscriptionWindow[]): AdaptiveSubscriptionWindow[] {
    const matched = collections.filter(items, (candidate: AdaptiveSubscriptionWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveSubscriptionWindows(store: AdaptiveSubscriptionWindowStore, query: AdaptiveSubscriptionWindowQuery): AdaptiveSubscriptionWindow[] {
  return query.apply(store.list());
}
