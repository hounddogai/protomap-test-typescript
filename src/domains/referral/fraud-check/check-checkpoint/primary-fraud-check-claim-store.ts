import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryFraudCheckClaim } from "./primary-fraud-check-claim.js";

/** Keeps primary fraud check claims by code. */
export interface PrimaryFraudCheckClaimStore {
  find(code: string): PrimaryFraudCheckClaim | undefined;
  save(item: PrimaryFraudCheckClaim): void;
  remove(code: string): boolean;
  list(): PrimaryFraudCheckClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryFraudCheckClaimStore implements PrimaryFraudCheckClaimStore {
  items: Map<string, PrimaryFraudCheckClaim>;
  order: string[];

  constructor(items: Map<string, PrimaryFraudCheckClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryFraudCheckClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryFraudCheckClaim): void {
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

  list(): PrimaryFraudCheckClaim[] {
    const out: PrimaryFraudCheckClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryFraudCheckClaimStore(): PrimaryFraudCheckClaimStore {
  return new MemoryPrimaryFraudCheckClaimStore(new Map<string, PrimaryFraudCheckClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryFraudCheckClaimStore implements PrimaryFraudCheckClaimStore {
  inner: PrimaryFraudCheckClaimStore;
  cache: cache.TtlCache<PrimaryFraudCheckClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryFraudCheckClaimStore,
    cacheValue: cache.TtlCache<PrimaryFraudCheckClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryFraudCheckClaim | undefined {
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

  save(item: PrimaryFraudCheckClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryFraudCheckClaim[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryFraudCheckClaimStore(inner: PrimaryFraudCheckClaimStore, ttl: number, clockValue: clock.Clock): PrimaryFraudCheckClaimStore {
  return new CachedPrimaryFraudCheckClaimStore(
    inner,
    cache.newTtlCache<PrimaryFraudCheckClaim>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary fraud check claims. Empty fields match all. */
export class PrimaryFraudCheckClaimQuery {
  label: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minPriority: number, statuses: string[], limit: number) {
    this.label = label;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryFraudCheckClaim): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryFraudCheckClaim[]): PrimaryFraudCheckClaim[] {
    const matched = collections.filter(items, (candidate: PrimaryFraudCheckClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryFraudCheckClaims(store: PrimaryFraudCheckClaimStore, query: PrimaryFraudCheckClaimQuery): PrimaryFraudCheckClaim[] {
  return query.apply(store.list());
}
