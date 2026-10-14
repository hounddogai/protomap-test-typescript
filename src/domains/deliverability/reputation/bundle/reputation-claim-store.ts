import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationClaim } from "./reputation-claim.js";

/** Keeps reputation claims by code. */
export interface ReputationClaimStore {
  find(code: string): ReputationClaim | undefined;
  save(item: ReputationClaim): void;
  remove(code: string): boolean;
  list(): ReputationClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationClaimStore implements ReputationClaimStore {
  items: Map<string, ReputationClaim>;
  order: string[];

  constructor(items: Map<string, ReputationClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationClaim): void {
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

  list(): ReputationClaim[] {
    const out: ReputationClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationClaimStore(): ReputationClaimStore {
  return new MemoryReputationClaimStore(new Map<string, ReputationClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationClaimStore implements ReputationClaimStore {
  inner: ReputationClaimStore;
  cache: cache.TtlCache<ReputationClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationClaimStore,
    cacheValue: cache.TtlCache<ReputationClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationClaim | undefined {
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

  save(item: ReputationClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationClaim[] {
    return this.inner.list();
  }
}

export function newCachedReputationClaimStore(inner: ReputationClaimStore, ttl: number, clockValue: clock.Clock): ReputationClaimStore {
  return new CachedReputationClaimStore(inner, cache.newTtlCache<ReputationClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects reputation claims. Empty fields match all. */
export class ReputationClaimQuery {
  label: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMaximum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationClaim): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationClaim[]): ReputationClaim[] {
    const matched = collections.filter(items, (candidate: ReputationClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationClaims(store: ReputationClaimStore, query: ReputationClaimQuery): ReputationClaim[] {
  return query.apply(store.list());
}
