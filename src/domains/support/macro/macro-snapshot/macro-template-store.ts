import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroTemplate } from "./macro-template.js";

/** Keeps macro templates by code. */
export interface MacroTemplateStore {
  find(code: string): MacroTemplate | undefined;
  save(item: MacroTemplate): void;
  remove(code: string): boolean;
  list(): MacroTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroTemplateStore implements MacroTemplateStore {
  items: Map<string, MacroTemplate>;
  order: string[];

  constructor(items: Map<string, MacroTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroTemplate): void {
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

  list(): MacroTemplate[] {
    const out: MacroTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroTemplateStore(): MacroTemplateStore {
  return new MemoryMacroTemplateStore(new Map<string, MacroTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroTemplateStore implements MacroTemplateStore {
  inner: MacroTemplateStore;
  cache: cache.TtlCache<MacroTemplate>;
  hits: number;
  misses: number;

  constructor(inner: MacroTemplateStore, cacheValue: cache.TtlCache<MacroTemplate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroTemplate | undefined {
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

  save(item: MacroTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroTemplate[] {
    return this.inner.list();
  }
}

export function newCachedMacroTemplateStore(inner: MacroTemplateStore, ttl: number, clockValue: clock.Clock): MacroTemplateStore {
  return new CachedMacroTemplateStore(inner, cache.newTtlCache<MacroTemplate>(1024, ttl, clockValue), 0, 0);
}

/** Selects macro templates. Empty fields match all. */
export class MacroTemplateQuery {
  segment: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCost: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroTemplate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroTemplate[]): MacroTemplate[] {
    const matched = collections.filter(items, (candidate: MacroTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroTemplates(store: MacroTemplateStore, query: MacroTemplateQuery): MacroTemplate[] {
  return query.apply(store.list());
}
