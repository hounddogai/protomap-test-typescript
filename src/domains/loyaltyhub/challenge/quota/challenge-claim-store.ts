import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeClaim } from "./challenge-claim.js";

/** Keeps challenge claims by code. */
export interface ChallengeClaimStore {
  find(code: string): ChallengeClaim | undefined;
  save(item: ChallengeClaim): void;
  remove(code: string): boolean;
  list(): ChallengeClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeClaimStore implements ChallengeClaimStore {
  items: Map<string, ChallengeClaim>;
  order: string[];

  constructor(items: Map<string, ChallengeClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeClaim): void {
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

  list(): ChallengeClaim[] {
    const out: ChallengeClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeClaimStore(): ChallengeClaimStore {
  return new MemoryChallengeClaimStore(new Map<string, ChallengeClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeClaimStore implements ChallengeClaimStore {
  inner: ChallengeClaimStore;
  cache: cache.TtlCache<ChallengeClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeClaimStore,
    cacheValue: cache.TtlCache<ChallengeClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeClaim | undefined {
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

  save(item: ChallengeClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeClaim[] {
    return this.inner.list();
  }
}

export function newCachedChallengeClaimStore(inner: ChallengeClaimStore, ttl: number, clockValue: clock.Clock): ChallengeClaimStore {
  return new CachedChallengeClaimStore(inner, cache.newTtlCache<ChallengeClaim>(256, ttl, clockValue), 0, 0);
}

/** Selects challenge claims. Empty fields match all. */
export class ChallengeClaimQuery {
  country: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minImpressions: number, statuses: string[], limit: number) {
    this.country = country;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeClaim): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeClaim[]): ChallengeClaim[] {
    const matched = collections.filter(items, (candidate: ChallengeClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeClaims(store: ChallengeClaimStore, query: ChallengeClaimQuery): ChallengeClaim[] {
  return query.apply(store.list());
}
