import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardClaim } from "./reward-claim.js";

/** Keeps reward claims by code. */
export interface RewardClaimStore {
  find(code: string): RewardClaim | undefined;
  save(item: RewardClaim): void;
  remove(code: string): boolean;
  list(): RewardClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardClaimStore implements RewardClaimStore {
  items: Map<string, RewardClaim>;
  order: string[];

  constructor(items: Map<string, RewardClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardClaim): void {
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

  list(): RewardClaim[] {
    const out: RewardClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardClaimStore(): RewardClaimStore {
  return new MemoryRewardClaimStore(new Map<string, RewardClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardClaimStore implements RewardClaimStore {
  inner: RewardClaimStore;
  cache: cache.TtlCache<RewardClaim>;
  hits: number;
  misses: number;

  constructor(inner: RewardClaimStore, cacheValue: cache.TtlCache<RewardClaim>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardClaim | undefined {
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

  save(item: RewardClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardClaim[] {
    return this.inner.list();
  }
}

export function newCachedRewardClaimStore(inner: RewardClaimStore, ttl: number, clockValue: clock.Clock): RewardClaimStore {
  return new CachedRewardClaimStore(inner, cache.newTtlCache<RewardClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects reward claims. Empty fields match all. */
export class RewardClaimQuery {
  label: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAttempts: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardClaim): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardClaim[]): RewardClaim[] {
    const matched = collections.filter(items, (candidate: RewardClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardClaims(store: RewardClaimStore, query: RewardClaimQuery): RewardClaim[] {
  return query.apply(store.list());
}
