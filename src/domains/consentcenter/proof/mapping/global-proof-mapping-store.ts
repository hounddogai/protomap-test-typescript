import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalProofMapping } from "./global-proof-mapping.js";

/** Keeps global proof mappings by code. */
export interface GlobalProofMappingStore {
  find(code: string): GlobalProofMapping | undefined;
  save(item: GlobalProofMapping): void;
  remove(code: string): boolean;
  list(): GlobalProofMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalProofMappingStore implements GlobalProofMappingStore {
  items: Map<string, GlobalProofMapping>;
  order: string[];

  constructor(items: Map<string, GlobalProofMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalProofMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalProofMapping): void {
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

  list(): GlobalProofMapping[] {
    const out: GlobalProofMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalProofMappingStore(): GlobalProofMappingStore {
  return new MemoryGlobalProofMappingStore(new Map<string, GlobalProofMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalProofMappingStore implements GlobalProofMappingStore {
  inner: GlobalProofMappingStore;
  cache: cache.TtlCache<GlobalProofMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalProofMappingStore,
    cacheValue: cache.TtlCache<GlobalProofMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalProofMapping | undefined {
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

  save(item: GlobalProofMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalProofMapping[] {
    return this.inner.list();
  }
}

export function newCachedGlobalProofMappingStore(inner: GlobalProofMappingStore, ttl: number, clockValue: clock.Clock): GlobalProofMappingStore {
  return new CachedGlobalProofMappingStore(inner, cache.newTtlCache<GlobalProofMapping>(512, ttl, clockValue), 0, 0);
}

/** Selects global proof mappings. Empty fields match all. */
export class GlobalProofMappingQuery {
  locale: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minEndsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalProofMapping): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalProofMapping[]): GlobalProofMapping[] {
    const matched = collections.filter(items, (candidate: GlobalProofMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalProofMappings(store: GlobalProofMappingStore, query: GlobalProofMappingQuery): GlobalProofMapping[] {
  return query.apply(store.list());
}
