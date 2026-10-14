import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelCycle } from "./model-cycle.js";

/** Keeps model cycles by code. */
export interface ModelCycleStore {
  find(code: string): ModelCycle | undefined;
  save(item: ModelCycle): void;
  remove(code: string): boolean;
  list(): ModelCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelCycleStore implements ModelCycleStore {
  items: Map<string, ModelCycle>;
  order: string[];

  constructor(items: Map<string, ModelCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelCycle): void {
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

  list(): ModelCycle[] {
    const out: ModelCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelCycleStore(): ModelCycleStore {
  return new MemoryModelCycleStore(new Map<string, ModelCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelCycleStore implements ModelCycleStore {
  inner: ModelCycleStore;
  cache: cache.TtlCache<ModelCycle>;
  hits: number;
  misses: number;

  constructor(inner: ModelCycleStore, cacheValue: cache.TtlCache<ModelCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelCycle | undefined {
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

  save(item: ModelCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelCycle[] {
    return this.inner.list();
  }
}

export function newCachedModelCycleStore(inner: ModelCycleStore, ttl: number, clockValue: clock.Clock): ModelCycleStore {
  return new CachedModelCycleStore(inner, cache.newTtlCache<ModelCycle>(64, ttl, clockValue), 0, 0);
}

/** Selects model cycles. Empty fields match all. */
export class ModelCycleQuery {
  utmSource: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minPriority: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelCycle): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelCycle[]): ModelCycle[] {
    const matched = collections.filter(items, (candidate: ModelCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelCycles(store: ModelCycleStore, query: ModelCycleQuery): ModelCycle[] {
  return query.apply(store.list());
}
