import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedFraudCheckMapping } from "./capped-fraud-check-mapping.js";

/** Keeps capped fraud check mappings by code. */
export interface CappedFraudCheckMappingStore {
  find(code: string): CappedFraudCheckMapping | undefined;
  save(item: CappedFraudCheckMapping): void;
  remove(code: string): boolean;
  list(): CappedFraudCheckMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedFraudCheckMappingStore implements CappedFraudCheckMappingStore {
  items: Map<string, CappedFraudCheckMapping>;
  order: string[];

  constructor(items: Map<string, CappedFraudCheckMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedFraudCheckMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedFraudCheckMapping): void {
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

  list(): CappedFraudCheckMapping[] {
    const out: CappedFraudCheckMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedFraudCheckMappingStore(): CappedFraudCheckMappingStore {
  return new MemoryCappedFraudCheckMappingStore(new Map<string, CappedFraudCheckMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedFraudCheckMappingStore implements CappedFraudCheckMappingStore {
  inner: CappedFraudCheckMappingStore;
  cache: cache.TtlCache<CappedFraudCheckMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedFraudCheckMappingStore,
    cacheValue: cache.TtlCache<CappedFraudCheckMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedFraudCheckMapping | undefined {
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

  save(item: CappedFraudCheckMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedFraudCheckMapping[] {
    return this.inner.list();
  }
}

export function newCachedCappedFraudCheckMappingStore(inner: CappedFraudCheckMappingStore, ttl: number, clockValue: clock.Clock): CappedFraudCheckMappingStore {
  return new CachedCappedFraudCheckMappingStore(
    inner,
    cache.newTtlCache<CappedFraudCheckMapping>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped fraud check mappings. Empty fields match all. */
export class CappedFraudCheckMappingQuery {
  title: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedFraudCheckMapping): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedFraudCheckMapping[]): CappedFraudCheckMapping[] {
    const matched = collections.filter(items, (candidate: CappedFraudCheckMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedFraudCheckMappings(store: CappedFraudCheckMappingStore, query: CappedFraudCheckMappingQuery): CappedFraudCheckMapping[] {
  return query.apply(store.list());
}
