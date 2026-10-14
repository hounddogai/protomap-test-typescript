import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictActivationClaim } from "./strict-activation-claim.js";

/** Keeps strict activation claims by code. */
export interface StrictActivationClaimStore {
  find(code: string): StrictActivationClaim | undefined;
  save(item: StrictActivationClaim): void;
  remove(code: string): boolean;
  list(): StrictActivationClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictActivationClaimStore implements StrictActivationClaimStore {
  items: Map<string, StrictActivationClaim>;
  order: string[];

  constructor(items: Map<string, StrictActivationClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictActivationClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictActivationClaim): void {
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

  list(): StrictActivationClaim[] {
    const out: StrictActivationClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictActivationClaimStore(): StrictActivationClaimStore {
  return new MemoryStrictActivationClaimStore(new Map<string, StrictActivationClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictActivationClaimStore implements StrictActivationClaimStore {
  inner: StrictActivationClaimStore;
  cache: cache.TtlCache<StrictActivationClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictActivationClaimStore,
    cacheValue: cache.TtlCache<StrictActivationClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictActivationClaim | undefined {
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

  save(item: StrictActivationClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictActivationClaim[] {
    return this.inner.list();
  }
}

export function newCachedStrictActivationClaimStore(inner: StrictActivationClaimStore, ttl: number, clockValue: clock.Clock): StrictActivationClaimStore {
  return new CachedStrictActivationClaimStore(
    inner,
    cache.newTtlCache<StrictActivationClaim>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict activation claims. Empty fields match all. */
export class StrictActivationClaimQuery {
  channel: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minOpenRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictActivationClaim): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictActivationClaim[]): StrictActivationClaim[] {
    const matched = collections.filter(items, (candidate: StrictActivationClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictActivationClaims(store: StrictActivationClaimStore, query: StrictActivationClaimQuery): StrictActivationClaim[] {
  return query.apply(store.list());
}
