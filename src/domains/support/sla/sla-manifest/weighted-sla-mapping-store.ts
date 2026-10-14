import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedSlaMapping } from "./weighted-sla-mapping.js";

/** Keeps weighted sla mappings by code. */
export interface WeightedSlaMappingStore {
  find(code: string): WeightedSlaMapping | undefined;
  save(item: WeightedSlaMapping): void;
  remove(code: string): boolean;
  list(): WeightedSlaMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedSlaMappingStore implements WeightedSlaMappingStore {
  items: Map<string, WeightedSlaMapping>;
  order: string[];

  constructor(items: Map<string, WeightedSlaMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedSlaMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedSlaMapping): void {
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

  list(): WeightedSlaMapping[] {
    const out: WeightedSlaMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedSlaMappingStore(): WeightedSlaMappingStore {
  return new MemoryWeightedSlaMappingStore(new Map<string, WeightedSlaMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedSlaMappingStore implements WeightedSlaMappingStore {
  inner: WeightedSlaMappingStore;
  cache: cache.TtlCache<WeightedSlaMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedSlaMappingStore,
    cacheValue: cache.TtlCache<WeightedSlaMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedSlaMapping | undefined {
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

  save(item: WeightedSlaMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedSlaMapping[] {
    return this.inner.list();
  }
}

export function newCachedWeightedSlaMappingStore(inner: WeightedSlaMappingStore, ttl: number, clockValue: clock.Clock): WeightedSlaMappingStore {
  return new CachedWeightedSlaMappingStore(inner, cache.newTtlCache<WeightedSlaMapping>(256, ttl, clockValue), 0, 0);
}

/** Selects weighted sla mappings. Empty fields match all. */
export class WeightedSlaMappingQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedSlaMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedSlaMapping[]): WeightedSlaMapping[] {
    const matched = collections.filter(items, (candidate: WeightedSlaMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedSlaMappings(store: WeightedSlaMappingStore, query: WeightedSlaMappingQuery): WeightedSlaMapping[] {
  return query.apply(store.list());
}
