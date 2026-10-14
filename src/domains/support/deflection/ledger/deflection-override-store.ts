import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionOverride } from "./deflection-override.js";

/** Keeps deflection overrides by code. */
export interface DeflectionOverrideStore {
  find(code: string): DeflectionOverride | undefined;
  save(item: DeflectionOverride): void;
  remove(code: string): boolean;
  list(): DeflectionOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionOverrideStore implements DeflectionOverrideStore {
  items: Map<string, DeflectionOverride>;
  order: string[];

  constructor(items: Map<string, DeflectionOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionOverride): void {
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

  list(): DeflectionOverride[] {
    const out: DeflectionOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionOverrideStore(): DeflectionOverrideStore {
  return new MemoryDeflectionOverrideStore(new Map<string, DeflectionOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionOverrideStore implements DeflectionOverrideStore {
  inner: DeflectionOverrideStore;
  cache: cache.TtlCache<DeflectionOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionOverrideStore,
    cacheValue: cache.TtlCache<DeflectionOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionOverride | undefined {
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

  save(item: DeflectionOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionOverride[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionOverrideStore(inner: DeflectionOverrideStore, ttl: number, clockValue: clock.Clock): DeflectionOverrideStore {
  return new CachedDeflectionOverrideStore(inner, cache.newTtlCache<DeflectionOverride>(64, ttl, clockValue), 0, 0);
}

/** Selects deflection overrides. Empty fields match all. */
export class DeflectionOverrideQuery {
  category: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBatchSize: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionOverride): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionOverride[]): DeflectionOverride[] {
    const matched = collections.filter(items, (candidate: DeflectionOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionOverrides(store: DeflectionOverrideStore, query: DeflectionOverrideQuery): DeflectionOverride[] {
  return query.apply(store.list());
}
