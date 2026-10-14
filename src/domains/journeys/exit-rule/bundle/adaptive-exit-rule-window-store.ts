import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveExitRuleWindow } from "./adaptive-exit-rule-window.js";

/** Keeps adaptive exit rule windows by code. */
export interface AdaptiveExitRuleWindowStore {
  find(code: string): AdaptiveExitRuleWindow | undefined;
  save(item: AdaptiveExitRuleWindow): void;
  remove(code: string): boolean;
  list(): AdaptiveExitRuleWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveExitRuleWindowStore implements AdaptiveExitRuleWindowStore {
  items: Map<string, AdaptiveExitRuleWindow>;
  order: string[];

  constructor(items: Map<string, AdaptiveExitRuleWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveExitRuleWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveExitRuleWindow): void {
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

  list(): AdaptiveExitRuleWindow[] {
    const out: AdaptiveExitRuleWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveExitRuleWindowStore(): AdaptiveExitRuleWindowStore {
  return new MemoryAdaptiveExitRuleWindowStore(new Map<string, AdaptiveExitRuleWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveExitRuleWindowStore implements AdaptiveExitRuleWindowStore {
  inner: AdaptiveExitRuleWindowStore;
  cache: cache.TtlCache<AdaptiveExitRuleWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveExitRuleWindowStore,
    cacheValue: cache.TtlCache<AdaptiveExitRuleWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveExitRuleWindow | undefined {
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

  save(item: AdaptiveExitRuleWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveExitRuleWindow[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveExitRuleWindowStore(inner: AdaptiveExitRuleWindowStore, ttl: number, clockValue: clock.Clock): AdaptiveExitRuleWindowStore {
  return new CachedAdaptiveExitRuleWindowStore(
    inner,
    cache.newTtlCache<AdaptiveExitRuleWindow>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive exit rule windows. Empty fields match all. */
export class AdaptiveExitRuleWindowQuery {
  country: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBid: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveExitRuleWindow): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveExitRuleWindow[]): AdaptiveExitRuleWindow[] {
    const matched = collections.filter(items, (candidate: AdaptiveExitRuleWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveExitRuleWindows(store: AdaptiveExitRuleWindowStore, query: AdaptiveExitRuleWindowQuery): AdaptiveExitRuleWindow[] {
  return query.apply(store.list());
}
