import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroVariance } from "./macro-variance.js";

/** Keeps macro variances by code. */
export interface MacroVarianceStore {
  find(code: string): MacroVariance | undefined;
  save(item: MacroVariance): void;
  remove(code: string): boolean;
  list(): MacroVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroVarianceStore implements MacroVarianceStore {
  items: Map<string, MacroVariance>;
  order: string[];

  constructor(items: Map<string, MacroVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroVariance): void {
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

  list(): MacroVariance[] {
    const out: MacroVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroVarianceStore(): MacroVarianceStore {
  return new MemoryMacroVarianceStore(new Map<string, MacroVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroVarianceStore implements MacroVarianceStore {
  inner: MacroVarianceStore;
  cache: cache.TtlCache<MacroVariance>;
  hits: number;
  misses: number;

  constructor(inner: MacroVarianceStore, cacheValue: cache.TtlCache<MacroVariance>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroVariance | undefined {
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

  save(item: MacroVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroVariance[] {
    return this.inner.list();
  }
}

export function newCachedMacroVarianceStore(inner: MacroVarianceStore, ttl: number, clockValue: clock.Clock): MacroVarianceStore {
  return new CachedMacroVarianceStore(inner, cache.newTtlCache<MacroVariance>(64, ttl, clockValue), 0, 0);
}

/** Selects macro variances. Empty fields match all. */
export class MacroVarianceQuery {
  channel: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSequence: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroVariance): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroVariance[]): MacroVariance[] {
    const matched = collections.filter(items, (candidate: MacroVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroVariances(store: MacroVarianceStore, query: MacroVarianceQuery): MacroVariance[] {
  return query.apply(store.list());
}
