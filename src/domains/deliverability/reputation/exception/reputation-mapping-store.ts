import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationMapping } from "./reputation-mapping.js";

/** Keeps reputation mappings by code. */
export interface ReputationMappingStore {
  find(code: string): ReputationMapping | undefined;
  save(item: ReputationMapping): void;
  remove(code: string): boolean;
  list(): ReputationMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationMappingStore implements ReputationMappingStore {
  items: Map<string, ReputationMapping>;
  order: string[];

  constructor(items: Map<string, ReputationMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationMapping): void {
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

  list(): ReputationMapping[] {
    const out: ReputationMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationMappingStore(): ReputationMappingStore {
  return new MemoryReputationMappingStore(new Map<string, ReputationMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationMappingStore implements ReputationMappingStore {
  inner: ReputationMappingStore;
  cache: cache.TtlCache<ReputationMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationMappingStore,
    cacheValue: cache.TtlCache<ReputationMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationMapping | undefined {
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

  save(item: ReputationMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationMapping[] {
    return this.inner.list();
  }
}

export function newCachedReputationMappingStore(inner: ReputationMappingStore, ttl: number, clockValue: clock.Clock): ReputationMappingStore {
  return new CachedReputationMappingStore(inner, cache.newTtlCache<ReputationMapping>(1024, ttl, clockValue), 0, 0);
}

/** Selects reputation mappings. Empty fields match all. */
export class ReputationMappingQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationMapping): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationMapping[]): ReputationMapping[] {
    const matched = collections.filter(items, (candidate: ReputationMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationMappings(store: ReputationMappingStore, query: ReputationMappingQuery): ReputationMapping[] {
  return query.apply(store.list());
}
