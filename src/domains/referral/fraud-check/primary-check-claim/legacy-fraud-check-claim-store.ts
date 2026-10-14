import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyFraudCheckClaim } from "./legacy-fraud-check-claim.js";

/** Keeps legacy fraud check claims by code. */
export interface LegacyFraudCheckClaimStore {
  find(code: string): LegacyFraudCheckClaim | undefined;
  save(item: LegacyFraudCheckClaim): void;
  remove(code: string): boolean;
  list(): LegacyFraudCheckClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyFraudCheckClaimStore implements LegacyFraudCheckClaimStore {
  items: Map<string, LegacyFraudCheckClaim>;
  order: string[];

  constructor(items: Map<string, LegacyFraudCheckClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyFraudCheckClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyFraudCheckClaim): void {
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

  list(): LegacyFraudCheckClaim[] {
    const out: LegacyFraudCheckClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyFraudCheckClaimStore(): LegacyFraudCheckClaimStore {
  return new MemoryLegacyFraudCheckClaimStore(new Map<string, LegacyFraudCheckClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyFraudCheckClaimStore implements LegacyFraudCheckClaimStore {
  inner: LegacyFraudCheckClaimStore;
  cache: cache.TtlCache<LegacyFraudCheckClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyFraudCheckClaimStore,
    cacheValue: cache.TtlCache<LegacyFraudCheckClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyFraudCheckClaim | undefined {
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

  save(item: LegacyFraudCheckClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyFraudCheckClaim[] {
    return this.inner.list();
  }
}

export function newCachedLegacyFraudCheckClaimStore(inner: LegacyFraudCheckClaimStore, ttl: number, clockValue: clock.Clock): LegacyFraudCheckClaimStore {
  return new CachedLegacyFraudCheckClaimStore(
    inner,
    cache.newTtlCache<LegacyFraudCheckClaim>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy fraud check claims. Empty fields match all. */
export class LegacyFraudCheckClaimQuery {
  label: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyFraudCheckClaim): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyFraudCheckClaim[]): LegacyFraudCheckClaim[] {
    const matched = collections.filter(items, (candidate: LegacyFraudCheckClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyFraudCheckClaims(store: LegacyFraudCheckClaimStore, query: LegacyFraudCheckClaimQuery): LegacyFraudCheckClaim[] {
  return query.apply(store.list());
}
