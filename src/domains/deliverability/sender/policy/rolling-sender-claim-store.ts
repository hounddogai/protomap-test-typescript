import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingSenderClaim } from "./rolling-sender-claim.js";

/** Keeps rolling sender claims by code. */
export interface RollingSenderClaimStore {
  find(code: string): RollingSenderClaim | undefined;
  save(item: RollingSenderClaim): void;
  remove(code: string): boolean;
  list(): RollingSenderClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingSenderClaimStore implements RollingSenderClaimStore {
  items: Map<string, RollingSenderClaim>;
  order: string[];

  constructor(items: Map<string, RollingSenderClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingSenderClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingSenderClaim): void {
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

  list(): RollingSenderClaim[] {
    const out: RollingSenderClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingSenderClaimStore(): RollingSenderClaimStore {
  return new MemoryRollingSenderClaimStore(new Map<string, RollingSenderClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingSenderClaimStore implements RollingSenderClaimStore {
  inner: RollingSenderClaimStore;
  cache: cache.TtlCache<RollingSenderClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingSenderClaimStore,
    cacheValue: cache.TtlCache<RollingSenderClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingSenderClaim | undefined {
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

  save(item: RollingSenderClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingSenderClaim[] {
    return this.inner.list();
  }
}

export function newCachedRollingSenderClaimStore(inner: RollingSenderClaimStore, ttl: number, clockValue: clock.Clock): RollingSenderClaimStore {
  return new CachedRollingSenderClaimStore(inner, cache.newTtlCache<RollingSenderClaim>(128, ttl, clockValue), 0, 0);
}

/** Selects rolling sender claims. Empty fields match all. */
export class RollingSenderClaimQuery {
  title: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minOpenRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingSenderClaim): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingSenderClaim[]): RollingSenderClaim[] {
    const matched = collections.filter(items, (candidate: RollingSenderClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingSenderClaims(store: RollingSenderClaimStore, query: RollingSenderClaimQuery): RollingSenderClaim[] {
  return query.apply(store.list());
}
