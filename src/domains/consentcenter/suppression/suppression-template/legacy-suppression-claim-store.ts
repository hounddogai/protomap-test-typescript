import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacySuppressionClaim } from "./legacy-suppression-claim.js";

/** Keeps legacy suppression claims by code. */
export interface LegacySuppressionClaimStore {
  find(code: string): LegacySuppressionClaim | undefined;
  save(item: LegacySuppressionClaim): void;
  remove(code: string): boolean;
  list(): LegacySuppressionClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacySuppressionClaimStore implements LegacySuppressionClaimStore {
  items: Map<string, LegacySuppressionClaim>;
  order: string[];

  constructor(items: Map<string, LegacySuppressionClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacySuppressionClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacySuppressionClaim): void {
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

  list(): LegacySuppressionClaim[] {
    const out: LegacySuppressionClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacySuppressionClaimStore(): LegacySuppressionClaimStore {
  return new MemoryLegacySuppressionClaimStore(new Map<string, LegacySuppressionClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacySuppressionClaimStore implements LegacySuppressionClaimStore {
  inner: LegacySuppressionClaimStore;
  cache: cache.TtlCache<LegacySuppressionClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacySuppressionClaimStore,
    cacheValue: cache.TtlCache<LegacySuppressionClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacySuppressionClaim | undefined {
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

  save(item: LegacySuppressionClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacySuppressionClaim[] {
    return this.inner.list();
  }
}

export function newCachedLegacySuppressionClaimStore(inner: LegacySuppressionClaimStore, ttl: number, clockValue: clock.Clock): LegacySuppressionClaimStore {
  return new CachedLegacySuppressionClaimStore(
    inner,
    cache.newTtlCache<LegacySuppressionClaim>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy suppression claims. Empty fields match all. */
export class LegacySuppressionClaimQuery {
  country: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRevision: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacySuppressionClaim): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacySuppressionClaim[]): LegacySuppressionClaim[] {
    const matched = collections.filter(items, (candidate: LegacySuppressionClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacySuppressionClaims(store: LegacySuppressionClaimStore, query: LegacySuppressionClaimQuery): LegacySuppressionClaim[] {
  return query.apply(store.list());
}
