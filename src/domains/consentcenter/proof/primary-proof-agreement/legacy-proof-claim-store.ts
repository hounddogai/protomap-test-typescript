import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyProofClaim } from "./legacy-proof-claim.js";

/** Keeps legacy proof claims by code. */
export interface LegacyProofClaimStore {
  find(code: string): LegacyProofClaim | undefined;
  save(item: LegacyProofClaim): void;
  remove(code: string): boolean;
  list(): LegacyProofClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyProofClaimStore implements LegacyProofClaimStore {
  items: Map<string, LegacyProofClaim>;
  order: string[];

  constructor(items: Map<string, LegacyProofClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyProofClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyProofClaim): void {
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

  list(): LegacyProofClaim[] {
    const out: LegacyProofClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyProofClaimStore(): LegacyProofClaimStore {
  return new MemoryLegacyProofClaimStore(new Map<string, LegacyProofClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyProofClaimStore implements LegacyProofClaimStore {
  inner: LegacyProofClaimStore;
  cache: cache.TtlCache<LegacyProofClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyProofClaimStore,
    cacheValue: cache.TtlCache<LegacyProofClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyProofClaim | undefined {
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

  save(item: LegacyProofClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyProofClaim[] {
    return this.inner.list();
  }
}

export function newCachedLegacyProofClaimStore(inner: LegacyProofClaimStore, ttl: number, clockValue: clock.Clock): LegacyProofClaimStore {
  return new CachedLegacyProofClaimStore(inner, cache.newTtlCache<LegacyProofClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects legacy proof claims. Empty fields match all. */
export class LegacyProofClaimQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyProofClaim): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyProofClaim[]): LegacyProofClaim[] {
    const matched = collections.filter(items, (candidate: LegacyProofClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyProofClaims(store: LegacyProofClaimStore, query: LegacyProofClaimQuery): LegacyProofClaim[] {
  return query.apply(store.list());
}
