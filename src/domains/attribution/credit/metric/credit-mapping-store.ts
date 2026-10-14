import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditMapping } from "./credit-mapping.js";

/** Keeps credit mappings by code. */
export interface CreditMappingStore {
  find(code: string): CreditMapping | undefined;
  save(item: CreditMapping): void;
  remove(code: string): boolean;
  list(): CreditMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditMappingStore implements CreditMappingStore {
  items: Map<string, CreditMapping>;
  order: string[];

  constructor(items: Map<string, CreditMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditMapping): void {
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

  list(): CreditMapping[] {
    const out: CreditMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditMappingStore(): CreditMappingStore {
  return new MemoryCreditMappingStore(new Map<string, CreditMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditMappingStore implements CreditMappingStore {
  inner: CreditMappingStore;
  cache: cache.TtlCache<CreditMapping>;
  hits: number;
  misses: number;

  constructor(inner: CreditMappingStore, cacheValue: cache.TtlCache<CreditMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditMapping | undefined {
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

  save(item: CreditMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditMapping[] {
    return this.inner.list();
  }
}

export function newCachedCreditMappingStore(inner: CreditMappingStore, ttl: number, clockValue: clock.Clock): CreditMappingStore {
  return new CachedCreditMappingStore(inner, cache.newTtlCache<CreditMapping>(512, ttl, clockValue), 0, 0);
}

/** Selects credit mappings. Empty fields match all. */
export class CreditMappingQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditMapping[]): CreditMapping[] {
    const matched = collections.filter(items, (candidate: CreditMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditMappings(store: CreditMappingStore, query: CreditMappingQuery): CreditMapping[] {
  return query.apply(store.list());
}
