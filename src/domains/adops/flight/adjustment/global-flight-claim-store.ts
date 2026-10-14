import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalFlightClaim } from "./global-flight-claim.js";

/** Keeps global flight claims by code. */
export interface GlobalFlightClaimStore {
  find(code: string): GlobalFlightClaim | undefined;
  save(item: GlobalFlightClaim): void;
  remove(code: string): boolean;
  list(): GlobalFlightClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalFlightClaimStore implements GlobalFlightClaimStore {
  items: Map<string, GlobalFlightClaim>;
  order: string[];

  constructor(items: Map<string, GlobalFlightClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalFlightClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalFlightClaim): void {
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

  list(): GlobalFlightClaim[] {
    const out: GlobalFlightClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalFlightClaimStore(): GlobalFlightClaimStore {
  return new MemoryGlobalFlightClaimStore(new Map<string, GlobalFlightClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalFlightClaimStore implements GlobalFlightClaimStore {
  inner: GlobalFlightClaimStore;
  cache: cache.TtlCache<GlobalFlightClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalFlightClaimStore,
    cacheValue: cache.TtlCache<GlobalFlightClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalFlightClaim | undefined {
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

  save(item: GlobalFlightClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalFlightClaim[] {
    return this.inner.list();
  }
}

export function newCachedGlobalFlightClaimStore(inner: GlobalFlightClaimStore, ttl: number, clockValue: clock.Clock): GlobalFlightClaimStore {
  return new CachedGlobalFlightClaimStore(inner, cache.newTtlCache<GlobalFlightClaim>(256, ttl, clockValue), 0, 0);
}

/** Selects global flight claims. Empty fields match all. */
export class GlobalFlightClaimQuery {
  name: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minVersion: number, statuses: string[], limit: number) {
    this.name = name;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalFlightClaim): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalFlightClaim[]): GlobalFlightClaim[] {
    const matched = collections.filter(items, (candidate: GlobalFlightClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalFlightClaims(store: GlobalFlightClaimStore, query: GlobalFlightClaimQuery): GlobalFlightClaim[] {
  return query.apply(store.list());
}
