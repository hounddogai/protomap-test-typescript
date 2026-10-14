import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainClaim } from "./domain-claim.js";

/** Keeps domain claims by code. */
export interface DomainClaimStore {
  find(code: string): DomainClaim | undefined;
  save(item: DomainClaim): void;
  remove(code: string): boolean;
  list(): DomainClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainClaimStore implements DomainClaimStore {
  items: Map<string, DomainClaim>;
  order: string[];

  constructor(items: Map<string, DomainClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainClaim): void {
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

  list(): DomainClaim[] {
    const out: DomainClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainClaimStore(): DomainClaimStore {
  return new MemoryDomainClaimStore(new Map<string, DomainClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainClaimStore implements DomainClaimStore {
  inner: DomainClaimStore;
  cache: cache.TtlCache<DomainClaim>;
  hits: number;
  misses: number;

  constructor(inner: DomainClaimStore, cacheValue: cache.TtlCache<DomainClaim>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainClaim | undefined {
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

  save(item: DomainClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainClaim[] {
    return this.inner.list();
  }
}

export function newCachedDomainClaimStore(inner: DomainClaimStore, ttl: number, clockValue: clock.Clock): DomainClaimStore {
  return new CachedDomainClaimStore(inner, cache.newTtlCache<DomainClaim>(256, ttl, clockValue), 0, 0);
}

/** Selects domain claims. Empty fields match all. */
export class DomainClaimQuery {
  channel: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minThreshold: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainClaim): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainClaim[]): DomainClaim[] {
    const matched = collections.filter(items, (candidate: DomainClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainClaims(store: DomainClaimStore, query: DomainClaimQuery): DomainClaim[] {
  return query.apply(store.list());
}
