import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedChallengeClaim } from "./capped-challenge-claim.js";

/** Keeps capped challenge claims by code. */
export interface CappedChallengeClaimStore {
  find(code: string): CappedChallengeClaim | undefined;
  save(item: CappedChallengeClaim): void;
  remove(code: string): boolean;
  list(): CappedChallengeClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedChallengeClaimStore implements CappedChallengeClaimStore {
  items: Map<string, CappedChallengeClaim>;
  order: string[];

  constructor(items: Map<string, CappedChallengeClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedChallengeClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedChallengeClaim): void {
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

  list(): CappedChallengeClaim[] {
    const out: CappedChallengeClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedChallengeClaimStore(): CappedChallengeClaimStore {
  return new MemoryCappedChallengeClaimStore(new Map<string, CappedChallengeClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedChallengeClaimStore implements CappedChallengeClaimStore {
  inner: CappedChallengeClaimStore;
  cache: cache.TtlCache<CappedChallengeClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedChallengeClaimStore,
    cacheValue: cache.TtlCache<CappedChallengeClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedChallengeClaim | undefined {
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

  save(item: CappedChallengeClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedChallengeClaim[] {
    return this.inner.list();
  }
}

export function newCachedCappedChallengeClaimStore(inner: CappedChallengeClaimStore, ttl: number, clockValue: clock.Clock): CappedChallengeClaimStore {
  return new CachedCappedChallengeClaimStore(
    inner,
    cache.newTtlCache<CappedChallengeClaim>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped challenge claims. Empty fields match all. */
export class CappedChallengeClaimQuery {
  country: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minSendAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedChallengeClaim): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedChallengeClaim[]): CappedChallengeClaim[] {
    const matched = collections.filter(items, (candidate: CappedChallengeClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedChallengeClaims(store: CappedChallengeClaimStore, query: CappedChallengeClaimQuery): CappedChallengeClaim[] {
  return query.apply(store.list());
}
