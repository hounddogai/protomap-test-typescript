import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroRequest } from "./macro-request.js";

/** Keeps macro requests by code. */
export interface MacroRequestStore {
  find(code: string): MacroRequest | undefined;
  save(item: MacroRequest): void;
  remove(code: string): boolean;
  list(): MacroRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroRequestStore implements MacroRequestStore {
  items: Map<string, MacroRequest>;
  order: string[];

  constructor(items: Map<string, MacroRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroRequest): void {
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

  list(): MacroRequest[] {
    const out: MacroRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroRequestStore(): MacroRequestStore {
  return new MemoryMacroRequestStore(new Map<string, MacroRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroRequestStore implements MacroRequestStore {
  inner: MacroRequestStore;
  cache: cache.TtlCache<MacroRequest>;
  hits: number;
  misses: number;

  constructor(inner: MacroRequestStore, cacheValue: cache.TtlCache<MacroRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroRequest | undefined {
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

  save(item: MacroRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroRequest[] {
    return this.inner.list();
  }
}

export function newCachedMacroRequestStore(inner: MacroRequestStore, ttl: number, clockValue: clock.Clock): MacroRequestStore {
  return new CachedMacroRequestStore(inner, cache.newTtlCache<MacroRequest>(256, ttl, clockValue), 0, 0);
}

/** Selects macro requests. Empty fields match all. */
export class MacroRequestQuery {
  title: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minClicks: number, statuses: string[], limit: number) {
    this.title = title;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroRequest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroRequest[]): MacroRequest[] {
    const matched = collections.filter(items, (candidate: MacroRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroRequests(store: MacroRequestStore, query: MacroRequestQuery): MacroRequest[] {
  return query.apply(store.list());
}
