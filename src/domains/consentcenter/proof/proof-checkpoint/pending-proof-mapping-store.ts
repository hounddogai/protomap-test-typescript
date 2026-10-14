import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingProofMapping } from "./pending-proof-mapping.js";

/** Keeps pending proof mappings by code. */
export interface PendingProofMappingStore {
  find(code: string): PendingProofMapping | undefined;
  save(item: PendingProofMapping): void;
  remove(code: string): boolean;
  list(): PendingProofMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingProofMappingStore implements PendingProofMappingStore {
  items: Map<string, PendingProofMapping>;
  order: string[];

  constructor(items: Map<string, PendingProofMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingProofMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingProofMapping): void {
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

  list(): PendingProofMapping[] {
    const out: PendingProofMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingProofMappingStore(): PendingProofMappingStore {
  return new MemoryPendingProofMappingStore(new Map<string, PendingProofMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingProofMappingStore implements PendingProofMappingStore {
  inner: PendingProofMappingStore;
  cache: cache.TtlCache<PendingProofMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingProofMappingStore,
    cacheValue: cache.TtlCache<PendingProofMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingProofMapping | undefined {
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

  save(item: PendingProofMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingProofMapping[] {
    return this.inner.list();
  }
}

export function newCachedPendingProofMappingStore(inner: PendingProofMappingStore, ttl: number, clockValue: clock.Clock): PendingProofMappingStore {
  return new CachedPendingProofMappingStore(inner, cache.newTtlCache<PendingProofMapping>(512, ttl, clockValue), 0, 0);
}

/** Selects pending proof mappings. Empty fields match all. */
export class PendingProofMappingQuery {
  country: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingProofMapping): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingProofMapping[]): PendingProofMapping[] {
    const matched = collections.filter(items, (candidate: PendingProofMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingProofMappings(store: PendingProofMappingStore, query: PendingProofMappingQuery): PendingProofMapping[] {
  return query.apply(store.list());
}
