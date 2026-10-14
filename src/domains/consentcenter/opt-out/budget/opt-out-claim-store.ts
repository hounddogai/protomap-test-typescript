import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutClaim } from "./opt-out-claim.js";

/** Keeps opt out claims by code. */
export interface OptOutClaimStore {
  find(code: string): OptOutClaim | undefined;
  save(item: OptOutClaim): void;
  remove(code: string): boolean;
  list(): OptOutClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutClaimStore implements OptOutClaimStore {
  items: Map<string, OptOutClaim>;
  order: string[];

  constructor(items: Map<string, OptOutClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutClaim): void {
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

  list(): OptOutClaim[] {
    const out: OptOutClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutClaimStore(): OptOutClaimStore {
  return new MemoryOptOutClaimStore(new Map<string, OptOutClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutClaimStore implements OptOutClaimStore {
  inner: OptOutClaimStore;
  cache: cache.TtlCache<OptOutClaim>;
  hits: number;
  misses: number;

  constructor(inner: OptOutClaimStore, cacheValue: cache.TtlCache<OptOutClaim>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutClaim | undefined {
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

  save(item: OptOutClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutClaim[] {
    return this.inner.list();
  }
}

export function newCachedOptOutClaimStore(inner: OptOutClaimStore, ttl: number, clockValue: clock.Clock): OptOutClaimStore {
  return new CachedOptOutClaimStore(inner, cache.newTtlCache<OptOutClaim>(512, ttl, clockValue), 0, 0);
}

/** Selects opt out claims. Empty fields match all. */
export class OptOutClaimQuery {
  category: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minStartsAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutClaim): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutClaim[]): OptOutClaim[] {
    const matched = collections.filter(items, (candidate: OptOutClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutClaims(store: OptOutClaimStore, query: OptOutClaimQuery): OptOutClaim[] {
  return query.apply(store.list());
}
