import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroBaseline } from "./macro-baseline.js";

/** Keeps macro baselines by code. */
export interface MacroBaselineStore {
  find(code: string): MacroBaseline | undefined;
  save(item: MacroBaseline): void;
  remove(code: string): boolean;
  list(): MacroBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroBaselineStore implements MacroBaselineStore {
  items: Map<string, MacroBaseline>;
  order: string[];

  constructor(items: Map<string, MacroBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroBaseline): void {
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

  list(): MacroBaseline[] {
    const out: MacroBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroBaselineStore(): MacroBaselineStore {
  return new MemoryMacroBaselineStore(new Map<string, MacroBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroBaselineStore implements MacroBaselineStore {
  inner: MacroBaselineStore;
  cache: cache.TtlCache<MacroBaseline>;
  hits: number;
  misses: number;

  constructor(inner: MacroBaselineStore, cacheValue: cache.TtlCache<MacroBaseline>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroBaseline | undefined {
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

  save(item: MacroBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroBaseline[] {
    return this.inner.list();
  }
}

export function newCachedMacroBaselineStore(inner: MacroBaselineStore, ttl: number, clockValue: clock.Clock): MacroBaselineStore {
  return new CachedMacroBaselineStore(inner, cache.newTtlCache<MacroBaseline>(1024, ttl, clockValue), 0, 0);
}

/** Selects macro baselines. Empty fields match all. */
export class MacroBaselineQuery {
  label: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minClicks: number, statuses: string[], limit: number) {
    this.label = label;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroBaseline): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroBaseline[]): MacroBaseline[] {
    const matched = collections.filter(items, (candidate: MacroBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroBaselines(store: MacroBaselineStore, query: MacroBaselineQuery): MacroBaseline[] {
  return query.apply(store.list());
}
