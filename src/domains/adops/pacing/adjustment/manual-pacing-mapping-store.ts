import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPacingMapping } from "./manual-pacing-mapping.js";

/** Keeps manual pacing mappings by code. */
export interface ManualPacingMappingStore {
  find(code: string): ManualPacingMapping | undefined;
  save(item: ManualPacingMapping): void;
  remove(code: string): boolean;
  list(): ManualPacingMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPacingMappingStore implements ManualPacingMappingStore {
  items: Map<string, ManualPacingMapping>;
  order: string[];

  constructor(items: Map<string, ManualPacingMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPacingMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPacingMapping): void {
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

  list(): ManualPacingMapping[] {
    const out: ManualPacingMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPacingMappingStore(): ManualPacingMappingStore {
  return new MemoryManualPacingMappingStore(new Map<string, ManualPacingMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPacingMappingStore implements ManualPacingMappingStore {
  inner: ManualPacingMappingStore;
  cache: cache.TtlCache<ManualPacingMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPacingMappingStore,
    cacheValue: cache.TtlCache<ManualPacingMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPacingMapping | undefined {
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

  save(item: ManualPacingMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPacingMapping[] {
    return this.inner.list();
  }
}

export function newCachedManualPacingMappingStore(inner: ManualPacingMappingStore, ttl: number, clockValue: clock.Clock): ManualPacingMappingStore {
  return new CachedManualPacingMappingStore(inner, cache.newTtlCache<ManualPacingMapping>(512, ttl, clockValue), 0, 0);
}

/** Selects manual pacing mappings. Empty fields match all. */
export class ManualPacingMappingQuery {
  country: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minImpressions: number, statuses: string[], limit: number) {
    this.country = country;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPacingMapping): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPacingMapping[]): ManualPacingMapping[] {
    const matched = collections.filter(items, (candidate: ManualPacingMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPacingMappings(store: ManualPacingMappingStore, query: ManualPacingMappingQuery): ManualPacingMapping[] {
  return query.apply(store.list());
}
