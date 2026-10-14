import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroTarget } from "./macro-target.js";

/** Keeps macro targets by code. */
export interface MacroTargetStore {
  find(code: string): MacroTarget | undefined;
  save(item: MacroTarget): void;
  remove(code: string): boolean;
  list(): MacroTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroTargetStore implements MacroTargetStore {
  items: Map<string, MacroTarget>;
  order: string[];

  constructor(items: Map<string, MacroTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroTarget): void {
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

  list(): MacroTarget[] {
    const out: MacroTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroTargetStore(): MacroTargetStore {
  return new MemoryMacroTargetStore(new Map<string, MacroTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroTargetStore implements MacroTargetStore {
  inner: MacroTargetStore;
  cache: cache.TtlCache<MacroTarget>;
  hits: number;
  misses: number;

  constructor(inner: MacroTargetStore, cacheValue: cache.TtlCache<MacroTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroTarget | undefined {
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

  save(item: MacroTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroTarget[] {
    return this.inner.list();
  }
}

export function newCachedMacroTargetStore(inner: MacroTargetStore, ttl: number, clockValue: clock.Clock): MacroTargetStore {
  return new CachedMacroTargetStore(inner, cache.newTtlCache<MacroTarget>(512, ttl, clockValue), 0, 0);
}

/** Selects macro targets. Empty fields match all. */
export class MacroTargetQuery {
  region: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCost: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroTarget): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroTarget[]): MacroTarget[] {
    const matched = collections.filter(items, (candidate: MacroTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroTargets(store: MacroTargetStore, query: MacroTargetQuery): MacroTarget[] {
  return query.apply(store.list());
}
