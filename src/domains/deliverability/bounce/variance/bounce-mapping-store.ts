import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceMapping } from "./bounce-mapping.js";

/** Keeps bounce mappings by code. */
export interface BounceMappingStore {
  find(code: string): BounceMapping | undefined;
  save(item: BounceMapping): void;
  remove(code: string): boolean;
  list(): BounceMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceMappingStore implements BounceMappingStore {
  items: Map<string, BounceMapping>;
  order: string[];

  constructor(items: Map<string, BounceMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceMapping): void {
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

  list(): BounceMapping[] {
    const out: BounceMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceMappingStore(): BounceMappingStore {
  return new MemoryBounceMappingStore(new Map<string, BounceMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceMappingStore implements BounceMappingStore {
  inner: BounceMappingStore;
  cache: cache.TtlCache<BounceMapping>;
  hits: number;
  misses: number;

  constructor(inner: BounceMappingStore, cacheValue: cache.TtlCache<BounceMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceMapping | undefined {
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

  save(item: BounceMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceMapping[] {
    return this.inner.list();
  }
}

export function newCachedBounceMappingStore(inner: BounceMappingStore, ttl: number, clockValue: clock.Clock): BounceMappingStore {
  return new CachedBounceMappingStore(inner, cache.newTtlCache<BounceMapping>(512, ttl, clockValue), 0, 0);
}

/** Selects bounce mappings. Empty fields match all. */
export class BounceMappingQuery {
  name: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minConversionRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceMapping[]): BounceMapping[] {
    const matched = collections.filter(items, (candidate: BounceMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceMappings(store: BounceMappingStore, query: BounceMappingQuery): BounceMapping[] {
  return query.apply(store.list());
}
