import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofMapping } from "./proof-mapping.js";

/** Keeps proof mappings by code. */
export interface ProofMappingStore {
  find(code: string): ProofMapping | undefined;
  save(item: ProofMapping): void;
  remove(code: string): boolean;
  list(): ProofMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofMappingStore implements ProofMappingStore {
  items: Map<string, ProofMapping>;
  order: string[];

  constructor(items: Map<string, ProofMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofMapping): void {
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

  list(): ProofMapping[] {
    const out: ProofMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofMappingStore(): ProofMappingStore {
  return new MemoryProofMappingStore(new Map<string, ProofMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofMappingStore implements ProofMappingStore {
  inner: ProofMappingStore;
  cache: cache.TtlCache<ProofMapping>;
  hits: number;
  misses: number;

  constructor(inner: ProofMappingStore, cacheValue: cache.TtlCache<ProofMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofMapping | undefined {
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

  save(item: ProofMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofMapping[] {
    return this.inner.list();
  }
}

export function newCachedProofMappingStore(inner: ProofMappingStore, ttl: number, clockValue: clock.Clock): ProofMappingStore {
  return new CachedProofMappingStore(inner, cache.newTtlCache<ProofMapping>(512, ttl, clockValue), 0, 0);
}

/** Selects proof mappings. Empty fields match all. */
export class ProofMappingQuery {
  segment: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minThreshold: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofMapping): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofMapping[]): ProofMapping[] {
    const matched = collections.filter(items, (candidate: ProofMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofMappings(store: ProofMappingStore, query: ProofMappingQuery): ProofMapping[] {
  return query.apply(store.list());
}
