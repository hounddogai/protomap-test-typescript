import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroEstimate } from "./macro-estimate.js";

/** Keeps macro estimates by code. */
export interface MacroEstimateStore {
  find(code: string): MacroEstimate | undefined;
  save(item: MacroEstimate): void;
  remove(code: string): boolean;
  list(): MacroEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroEstimateStore implements MacroEstimateStore {
  items: Map<string, MacroEstimate>;
  order: string[];

  constructor(items: Map<string, MacroEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroEstimate): void {
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

  list(): MacroEstimate[] {
    const out: MacroEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroEstimateStore(): MacroEstimateStore {
  return new MemoryMacroEstimateStore(new Map<string, MacroEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroEstimateStore implements MacroEstimateStore {
  inner: MacroEstimateStore;
  cache: cache.TtlCache<MacroEstimate>;
  hits: number;
  misses: number;

  constructor(inner: MacroEstimateStore, cacheValue: cache.TtlCache<MacroEstimate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroEstimate | undefined {
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

  save(item: MacroEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroEstimate[] {
    return this.inner.list();
  }
}

export function newCachedMacroEstimateStore(inner: MacroEstimateStore, ttl: number, clockValue: clock.Clock): MacroEstimateStore {
  return new CachedMacroEstimateStore(inner, cache.newTtlCache<MacroEstimate>(512, ttl, clockValue), 0, 0);
}

/** Selects macro estimates. Empty fields match all. */
export class MacroEstimateQuery {
  title: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAmount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroEstimate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroEstimate[]): MacroEstimate[] {
    const matched = collections.filter(items, (candidate: MacroEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroEstimates(store: MacroEstimateStore, query: MacroEstimateQuery): MacroEstimate[] {
  return query.apply(store.list());
}
