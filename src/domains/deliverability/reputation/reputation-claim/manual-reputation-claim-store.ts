import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualReputationClaim } from "./manual-reputation-claim.js";

/** Keeps manual reputation claims by code. */
export interface ManualReputationClaimStore {
  find(code: string): ManualReputationClaim | undefined;
  save(item: ManualReputationClaim): void;
  remove(code: string): boolean;
  list(): ManualReputationClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualReputationClaimStore implements ManualReputationClaimStore {
  items: Map<string, ManualReputationClaim>;
  order: string[];

  constructor(items: Map<string, ManualReputationClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualReputationClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualReputationClaim): void {
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

  list(): ManualReputationClaim[] {
    const out: ManualReputationClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualReputationClaimStore(): ManualReputationClaimStore {
  return new MemoryManualReputationClaimStore(new Map<string, ManualReputationClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualReputationClaimStore implements ManualReputationClaimStore {
  inner: ManualReputationClaimStore;
  cache: cache.TtlCache<ManualReputationClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualReputationClaimStore,
    cacheValue: cache.TtlCache<ManualReputationClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualReputationClaim | undefined {
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

  save(item: ManualReputationClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualReputationClaim[] {
    return this.inner.list();
  }
}

export function newCachedManualReputationClaimStore(inner: ManualReputationClaimStore, ttl: number, clockValue: clock.Clock): ManualReputationClaimStore {
  return new CachedManualReputationClaimStore(
    inner,
    cache.newTtlCache<ManualReputationClaim>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual reputation claims. Empty fields match all. */
export class ManualReputationClaimQuery {
  label: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualReputationClaim): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualReputationClaim[]): ManualReputationClaim[] {
    const matched = collections.filter(items, (candidate: ManualReputationClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualReputationClaims(store: ManualReputationClaimStore, query: ManualReputationClaimQuery): ManualReputationClaim[] {
  return query.apply(store.list());
}
