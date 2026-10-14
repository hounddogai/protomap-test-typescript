import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathClaim } from "./path-claim.js";

/** Keeps path claims by code. */
export interface PathClaimStore {
  find(code: string): PathClaim | undefined;
  save(item: PathClaim): void;
  remove(code: string): boolean;
  list(): PathClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathClaimStore implements PathClaimStore {
  items: Map<string, PathClaim>;
  order: string[];

  constructor(items: Map<string, PathClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathClaim): void {
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

  list(): PathClaim[] {
    const out: PathClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathClaimStore(): PathClaimStore {
  return new MemoryPathClaimStore(new Map<string, PathClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathClaimStore implements PathClaimStore {
  inner: PathClaimStore;
  cache: cache.TtlCache<PathClaim>;
  hits: number;
  misses: number;

  constructor(inner: PathClaimStore, cacheValue: cache.TtlCache<PathClaim>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathClaim | undefined {
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

  save(item: PathClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathClaim[] {
    return this.inner.list();
  }
}

export function newCachedPathClaimStore(inner: PathClaimStore, ttl: number, clockValue: clock.Clock): PathClaimStore {
  return new CachedPathClaimStore(inner, cache.newTtlCache<PathClaim>(512, ttl, clockValue), 0, 0);
}

/** Selects path claims. Empty fields match all. */
export class PathClaimQuery {
  unit: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathClaim): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathClaim[]): PathClaim[] {
    const matched = collections.filter(items, (candidate: PathClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathClaims(store: PathClaimStore, query: PathClaimQuery): PathClaim[] {
  return query.apply(store.list());
}
