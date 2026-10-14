import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofRequest } from "./proof-request.js";

/** Keeps proof requests by code. */
export interface ProofRequestStore {
  find(code: string): ProofRequest | undefined;
  save(item: ProofRequest): void;
  remove(code: string): boolean;
  list(): ProofRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofRequestStore implements ProofRequestStore {
  items: Map<string, ProofRequest>;
  order: string[];

  constructor(items: Map<string, ProofRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofRequest): void {
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

  list(): ProofRequest[] {
    const out: ProofRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofRequestStore(): ProofRequestStore {
  return new MemoryProofRequestStore(new Map<string, ProofRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofRequestStore implements ProofRequestStore {
  inner: ProofRequestStore;
  cache: cache.TtlCache<ProofRequest>;
  hits: number;
  misses: number;

  constructor(inner: ProofRequestStore, cacheValue: cache.TtlCache<ProofRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofRequest | undefined {
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

  save(item: ProofRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofRequest[] {
    return this.inner.list();
  }
}

export function newCachedProofRequestStore(inner: ProofRequestStore, ttl: number, clockValue: clock.Clock): ProofRequestStore {
  return new CachedProofRequestStore(inner, cache.newTtlCache<ProofRequest>(256, ttl, clockValue), 0, 0);
}

/** Selects proof requests. Empty fields match all. */
export class ProofRequestQuery {
  region: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minLimit: number, statuses: string[], limit: number) {
    this.region = region;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofRequest): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofRequest[]): ProofRequest[] {
    const matched = collections.filter(items, (candidate: ProofRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofRequests(store: ProofRequestStore, query: ProofRequestQuery): ProofRequest[] {
  return query.apply(store.list());
}
