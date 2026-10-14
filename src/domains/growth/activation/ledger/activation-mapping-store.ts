import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationMapping } from "./activation-mapping.js";

/** Keeps activation mappings by code. */
export interface ActivationMappingStore {
  find(code: string): ActivationMapping | undefined;
  save(item: ActivationMapping): void;
  remove(code: string): boolean;
  list(): ActivationMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationMappingStore implements ActivationMappingStore {
  items: Map<string, ActivationMapping>;
  order: string[];

  constructor(items: Map<string, ActivationMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationMapping): void {
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

  list(): ActivationMapping[] {
    const out: ActivationMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationMappingStore(): ActivationMappingStore {
  return new MemoryActivationMappingStore(new Map<string, ActivationMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationMappingStore implements ActivationMappingStore {
  inner: ActivationMappingStore;
  cache: cache.TtlCache<ActivationMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationMappingStore,
    cacheValue: cache.TtlCache<ActivationMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationMapping | undefined {
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

  save(item: ActivationMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationMapping[] {
    return this.inner.list();
  }
}

export function newCachedActivationMappingStore(inner: ActivationMappingStore, ttl: number, clockValue: clock.Clock): ActivationMappingStore {
  return new CachedActivationMappingStore(inner, cache.newTtlCache<ActivationMapping>(128, ttl, clockValue), 0, 0);
}

/** Selects activation mappings. Empty fields match all. */
export class ActivationMappingQuery {
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

  matches(item: ActivationMapping): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationMapping[]): ActivationMapping[] {
    const matched = collections.filter(items, (candidate: ActivationMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationMappings(store: ActivationMappingStore, query: ActivationMappingQuery): ActivationMapping[] {
  return query.apply(store.list());
}
