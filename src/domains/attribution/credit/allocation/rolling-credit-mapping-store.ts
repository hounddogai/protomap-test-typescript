import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingCreditMapping } from "./rolling-credit-mapping.js";

/** Keeps rolling credit mappings by code. */
export interface RollingCreditMappingStore {
  find(code: string): RollingCreditMapping | undefined;
  save(item: RollingCreditMapping): void;
  remove(code: string): boolean;
  list(): RollingCreditMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingCreditMappingStore implements RollingCreditMappingStore {
  items: Map<string, RollingCreditMapping>;
  order: string[];

  constructor(items: Map<string, RollingCreditMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingCreditMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingCreditMapping): void {
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

  list(): RollingCreditMapping[] {
    const out: RollingCreditMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingCreditMappingStore(): RollingCreditMappingStore {
  return new MemoryRollingCreditMappingStore(new Map<string, RollingCreditMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingCreditMappingStore implements RollingCreditMappingStore {
  inner: RollingCreditMappingStore;
  cache: cache.TtlCache<RollingCreditMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingCreditMappingStore,
    cacheValue: cache.TtlCache<RollingCreditMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingCreditMapping | undefined {
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

  save(item: RollingCreditMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingCreditMapping[] {
    return this.inner.list();
  }
}

export function newCachedRollingCreditMappingStore(inner: RollingCreditMappingStore, ttl: number, clockValue: clock.Clock): RollingCreditMappingStore {
  return new CachedRollingCreditMappingStore(
    inner,
    cache.newTtlCache<RollingCreditMapping>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling credit mappings. Empty fields match all. */
export class RollingCreditMappingQuery {
  title: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWeight: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingCreditMapping): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingCreditMapping[]): RollingCreditMapping[] {
    const matched = collections.filter(items, (candidate: RollingCreditMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingCreditMappings(store: RollingCreditMappingStore, query: RollingCreditMappingQuery): RollingCreditMapping[] {
  return query.apply(store.list());
}
