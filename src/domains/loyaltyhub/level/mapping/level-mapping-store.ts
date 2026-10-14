import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelMapping } from "./level-mapping.js";

/** Keeps level mappings by code. */
export interface LevelMappingStore {
  find(code: string): LevelMapping | undefined;
  save(item: LevelMapping): void;
  remove(code: string): boolean;
  list(): LevelMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelMappingStore implements LevelMappingStore {
  items: Map<string, LevelMapping>;
  order: string[];

  constructor(items: Map<string, LevelMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelMapping): void {
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

  list(): LevelMapping[] {
    const out: LevelMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelMappingStore(): LevelMappingStore {
  return new MemoryLevelMappingStore(new Map<string, LevelMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelMappingStore implements LevelMappingStore {
  inner: LevelMappingStore;
  cache: cache.TtlCache<LevelMapping>;
  hits: number;
  misses: number;

  constructor(inner: LevelMappingStore, cacheValue: cache.TtlCache<LevelMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelMapping | undefined {
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

  save(item: LevelMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelMapping[] {
    return this.inner.list();
  }
}

export function newCachedLevelMappingStore(inner: LevelMappingStore, ttl: number, clockValue: clock.Clock): LevelMappingStore {
  return new CachedLevelMappingStore(inner, cache.newTtlCache<LevelMapping>(1024, ttl, clockValue), 0, 0);
}

/** Selects level mappings. Empty fields match all. */
export class LevelMappingQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelMapping): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelMapping[]): LevelMapping[] {
    const matched = collections.filter(items, (candidate: LevelMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelMappings(store: LevelMappingStore, query: LevelMappingQuery): LevelMapping[] {
  return query.apply(store.list());
}
