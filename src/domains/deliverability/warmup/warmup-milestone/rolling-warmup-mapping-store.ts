import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingWarmupMapping } from "./rolling-warmup-mapping.js";

/** Keeps rolling warmup mappings by code. */
export interface RollingWarmupMappingStore {
  find(code: string): RollingWarmupMapping | undefined;
  save(item: RollingWarmupMapping): void;
  remove(code: string): boolean;
  list(): RollingWarmupMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingWarmupMappingStore implements RollingWarmupMappingStore {
  items: Map<string, RollingWarmupMapping>;
  order: string[];

  constructor(items: Map<string, RollingWarmupMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingWarmupMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingWarmupMapping): void {
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

  list(): RollingWarmupMapping[] {
    const out: RollingWarmupMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingWarmupMappingStore(): RollingWarmupMappingStore {
  return new MemoryRollingWarmupMappingStore(new Map<string, RollingWarmupMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingWarmupMappingStore implements RollingWarmupMappingStore {
  inner: RollingWarmupMappingStore;
  cache: cache.TtlCache<RollingWarmupMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingWarmupMappingStore,
    cacheValue: cache.TtlCache<RollingWarmupMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingWarmupMapping | undefined {
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

  save(item: RollingWarmupMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingWarmupMapping[] {
    return this.inner.list();
  }
}

export function newCachedRollingWarmupMappingStore(inner: RollingWarmupMappingStore, ttl: number, clockValue: clock.Clock): RollingWarmupMappingStore {
  return new CachedRollingWarmupMappingStore(
    inner,
    cache.newTtlCache<RollingWarmupMapping>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling warmup mappings. Empty fields match all. */
export class RollingWarmupMappingQuery {
  label: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minLimit: number, statuses: string[], limit: number) {
    this.label = label;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingWarmupMapping): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingWarmupMapping[]): RollingWarmupMapping[] {
    const matched = collections.filter(items, (candidate: RollingWarmupMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingWarmupMappings(store: RollingWarmupMappingStore, query: RollingWarmupMappingQuery): RollingWarmupMapping[] {
  return query.apply(store.list());
}
