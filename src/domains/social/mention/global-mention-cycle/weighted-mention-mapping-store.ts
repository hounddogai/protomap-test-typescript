import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedMentionMapping } from "./weighted-mention-mapping.js";

/** Keeps weighted mention mappings by code. */
export interface WeightedMentionMappingStore {
  find(code: string): WeightedMentionMapping | undefined;
  save(item: WeightedMentionMapping): void;
  remove(code: string): boolean;
  list(): WeightedMentionMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedMentionMappingStore implements WeightedMentionMappingStore {
  items: Map<string, WeightedMentionMapping>;
  order: string[];

  constructor(items: Map<string, WeightedMentionMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedMentionMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedMentionMapping): void {
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

  list(): WeightedMentionMapping[] {
    const out: WeightedMentionMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedMentionMappingStore(): WeightedMentionMappingStore {
  return new MemoryWeightedMentionMappingStore(new Map<string, WeightedMentionMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedMentionMappingStore implements WeightedMentionMappingStore {
  inner: WeightedMentionMappingStore;
  cache: cache.TtlCache<WeightedMentionMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedMentionMappingStore,
    cacheValue: cache.TtlCache<WeightedMentionMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedMentionMapping | undefined {
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

  save(item: WeightedMentionMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedMentionMapping[] {
    return this.inner.list();
  }
}

export function newCachedWeightedMentionMappingStore(inner: WeightedMentionMappingStore, ttl: number, clockValue: clock.Clock): WeightedMentionMappingStore {
  return new CachedWeightedMentionMappingStore(
    inner,
    cache.newTtlCache<WeightedMentionMapping>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted mention mappings. Empty fields match all. */
export class WeightedMentionMappingQuery {
  locale: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minImpressions: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedMentionMapping): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedMentionMapping[]): WeightedMentionMapping[] {
    const matched = collections.filter(items, (candidate: WeightedMentionMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedMentionMappings(store: WeightedMentionMappingStore, query: WeightedMentionMappingQuery): WeightedMentionMapping[] {
  return query.apply(store.list());
}
