import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictBidRuleWindow } from "./strict-bid-rule-window.js";

/** Keeps strict bid rule windows by code. */
export interface StrictBidRuleWindowStore {
  find(code: string): StrictBidRuleWindow | undefined;
  save(item: StrictBidRuleWindow): void;
  remove(code: string): boolean;
  list(): StrictBidRuleWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictBidRuleWindowStore implements StrictBidRuleWindowStore {
  items: Map<string, StrictBidRuleWindow>;
  order: string[];

  constructor(items: Map<string, StrictBidRuleWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictBidRuleWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictBidRuleWindow): void {
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

  list(): StrictBidRuleWindow[] {
    const out: StrictBidRuleWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictBidRuleWindowStore(): StrictBidRuleWindowStore {
  return new MemoryStrictBidRuleWindowStore(new Map<string, StrictBidRuleWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictBidRuleWindowStore implements StrictBidRuleWindowStore {
  inner: StrictBidRuleWindowStore;
  cache: cache.TtlCache<StrictBidRuleWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictBidRuleWindowStore,
    cacheValue: cache.TtlCache<StrictBidRuleWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictBidRuleWindow | undefined {
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

  save(item: StrictBidRuleWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictBidRuleWindow[] {
    return this.inner.list();
  }
}

export function newCachedStrictBidRuleWindowStore(inner: StrictBidRuleWindowStore, ttl: number, clockValue: clock.Clock): StrictBidRuleWindowStore {
  return new CachedStrictBidRuleWindowStore(inner, cache.newTtlCache<StrictBidRuleWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects strict bid rule windows. Empty fields match all. */
export class StrictBidRuleWindowQuery {
  category: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minQuantity: number, statuses: string[], limit: number) {
    this.category = category;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictBidRuleWindow): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictBidRuleWindow[]): StrictBidRuleWindow[] {
    const matched = collections.filter(items, (candidate: StrictBidRuleWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictBidRuleWindows(store: StrictBidRuleWindowStore, query: StrictBidRuleWindowQuery): StrictBidRuleWindow[] {
  return query.apply(store.list());
}
