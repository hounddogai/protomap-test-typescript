import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientFunnelClaim } from "./lenient-funnel-claim.js";

/** Keeps lenient funnel claims by code. */
export interface LenientFunnelClaimStore {
  find(code: string): LenientFunnelClaim | undefined;
  save(item: LenientFunnelClaim): void;
  remove(code: string): boolean;
  list(): LenientFunnelClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientFunnelClaimStore implements LenientFunnelClaimStore {
  items: Map<string, LenientFunnelClaim>;
  order: string[];

  constructor(items: Map<string, LenientFunnelClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientFunnelClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientFunnelClaim): void {
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

  list(): LenientFunnelClaim[] {
    const out: LenientFunnelClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientFunnelClaimStore(): LenientFunnelClaimStore {
  return new MemoryLenientFunnelClaimStore(new Map<string, LenientFunnelClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientFunnelClaimStore implements LenientFunnelClaimStore {
  inner: LenientFunnelClaimStore;
  cache: cache.TtlCache<LenientFunnelClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientFunnelClaimStore,
    cacheValue: cache.TtlCache<LenientFunnelClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientFunnelClaim | undefined {
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

  save(item: LenientFunnelClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientFunnelClaim[] {
    return this.inner.list();
  }
}

export function newCachedLenientFunnelClaimStore(inner: LenientFunnelClaimStore, ttl: number, clockValue: clock.Clock): LenientFunnelClaimStore {
  return new CachedLenientFunnelClaimStore(inner, cache.newTtlCache<LenientFunnelClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient funnel claims. Empty fields match all. */
export class LenientFunnelClaimQuery {
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

  matches(item: LenientFunnelClaim): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientFunnelClaim[]): LenientFunnelClaim[] {
    const matched = collections.filter(items, (candidate: LenientFunnelClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientFunnelClaims(store: LenientFunnelClaimStore, query: LenientFunnelClaimQuery): LenientFunnelClaim[] {
  return query.apply(store.list());
}
