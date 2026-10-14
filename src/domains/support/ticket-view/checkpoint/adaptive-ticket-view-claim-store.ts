import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveTicketViewClaim } from "./adaptive-ticket-view-claim.js";

/** Keeps adaptive ticket view claims by code. */
export interface AdaptiveTicketViewClaimStore {
  find(code: string): AdaptiveTicketViewClaim | undefined;
  save(item: AdaptiveTicketViewClaim): void;
  remove(code: string): boolean;
  list(): AdaptiveTicketViewClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveTicketViewClaimStore implements AdaptiveTicketViewClaimStore {
  items: Map<string, AdaptiveTicketViewClaim>;
  order: string[];

  constructor(items: Map<string, AdaptiveTicketViewClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveTicketViewClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveTicketViewClaim): void {
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

  list(): AdaptiveTicketViewClaim[] {
    const out: AdaptiveTicketViewClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveTicketViewClaimStore(): AdaptiveTicketViewClaimStore {
  return new MemoryAdaptiveTicketViewClaimStore(new Map<string, AdaptiveTicketViewClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveTicketViewClaimStore implements AdaptiveTicketViewClaimStore {
  inner: AdaptiveTicketViewClaimStore;
  cache: cache.TtlCache<AdaptiveTicketViewClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveTicketViewClaimStore,
    cacheValue: cache.TtlCache<AdaptiveTicketViewClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveTicketViewClaim | undefined {
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

  save(item: AdaptiveTicketViewClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveTicketViewClaim[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveTicketViewClaimStore(inner: AdaptiveTicketViewClaimStore, ttl: number, clockValue: clock.Clock): AdaptiveTicketViewClaimStore {
  return new CachedAdaptiveTicketViewClaimStore(
    inner,
    cache.newTtlCache<AdaptiveTicketViewClaim>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive ticket view claims. Empty fields match all. */
export class AdaptiveTicketViewClaimQuery {
  source: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveTicketViewClaim): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveTicketViewClaim[]): AdaptiveTicketViewClaim[] {
    const matched = collections.filter(items, (candidate: AdaptiveTicketViewClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveTicketViewClaims(store: AdaptiveTicketViewClaimStore, query: AdaptiveTicketViewClaimQuery): AdaptiveTicketViewClaim[] {
  return query.apply(store.list());
}
