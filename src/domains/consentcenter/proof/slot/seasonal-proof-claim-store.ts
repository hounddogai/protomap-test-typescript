import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalProofClaim } from "./seasonal-proof-claim.js";

/** Keeps seasonal proof claims by code. */
export interface SeasonalProofClaimStore {
  find(code: string): SeasonalProofClaim | undefined;
  save(item: SeasonalProofClaim): void;
  remove(code: string): boolean;
  list(): SeasonalProofClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalProofClaimStore implements SeasonalProofClaimStore {
  items: Map<string, SeasonalProofClaim>;
  order: string[];

  constructor(items: Map<string, SeasonalProofClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalProofClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalProofClaim): void {
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

  list(): SeasonalProofClaim[] {
    const out: SeasonalProofClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalProofClaimStore(): SeasonalProofClaimStore {
  return new MemorySeasonalProofClaimStore(new Map<string, SeasonalProofClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalProofClaimStore implements SeasonalProofClaimStore {
  inner: SeasonalProofClaimStore;
  cache: cache.TtlCache<SeasonalProofClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalProofClaimStore,
    cacheValue: cache.TtlCache<SeasonalProofClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalProofClaim | undefined {
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

  save(item: SeasonalProofClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalProofClaim[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalProofClaimStore(inner: SeasonalProofClaimStore, ttl: number, clockValue: clock.Clock): SeasonalProofClaimStore {
  return new CachedSeasonalProofClaimStore(inner, cache.newTtlCache<SeasonalProofClaim>(128, ttl, clockValue), 0, 0);
}

/** Selects seasonal proof claims. Empty fields match all. */
export class SeasonalProofClaimQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalProofClaim): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalProofClaim[]): SeasonalProofClaim[] {
    const matched = collections.filter(items, (candidate: SeasonalProofClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalProofClaims(store: SeasonalProofClaimStore, query: SeasonalProofClaimQuery): SeasonalProofClaim[] {
  return query.apply(store.list());
}
