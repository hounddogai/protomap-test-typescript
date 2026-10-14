import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroMapping } from "./macro-mapping.js";

/** Keeps macro mappings by code. */
export interface MacroMappingStore {
  find(code: string): MacroMapping | undefined;
  save(item: MacroMapping): void;
  remove(code: string): boolean;
  list(): MacroMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroMappingStore implements MacroMappingStore {
  items: Map<string, MacroMapping>;
  order: string[];

  constructor(items: Map<string, MacroMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroMapping): void {
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

  list(): MacroMapping[] {
    const out: MacroMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroMappingStore(): MacroMappingStore {
  return new MemoryMacroMappingStore(new Map<string, MacroMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroMappingStore implements MacroMappingStore {
  inner: MacroMappingStore;
  cache: cache.TtlCache<MacroMapping>;
  hits: number;
  misses: number;

  constructor(inner: MacroMappingStore, cacheValue: cache.TtlCache<MacroMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroMapping | undefined {
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

  save(item: MacroMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroMapping[] {
    return this.inner.list();
  }
}

export function newCachedMacroMappingStore(inner: MacroMappingStore, ttl: number, clockValue: clock.Clock): MacroMappingStore {
  return new CachedMacroMappingStore(inner, cache.newTtlCache<MacroMapping>(256, ttl, clockValue), 0, 0);
}

/** Selects macro mappings. Empty fields match all. */
export class MacroMappingQuery {
  name: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSendAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroMapping[]): MacroMapping[] {
    const matched = collections.filter(items, (candidate: MacroMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroMappings(store: MacroMappingStore, query: MacroMappingQuery): MacroMapping[] {
  return query.apply(store.list());
}
