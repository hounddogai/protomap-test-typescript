import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptivePayoutAssignment } from "./adaptive-payout-assignment.js";

/** Keeps adaptive payout assignments by code. */
export interface AdaptivePayoutAssignmentStore {
  find(code: string): AdaptivePayoutAssignment | undefined;
  save(item: AdaptivePayoutAssignment): void;
  remove(code: string): boolean;
  list(): AdaptivePayoutAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptivePayoutAssignmentStore implements AdaptivePayoutAssignmentStore {
  items: Map<string, AdaptivePayoutAssignment>;
  order: string[];

  constructor(items: Map<string, AdaptivePayoutAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptivePayoutAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptivePayoutAssignment): void {
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

  list(): AdaptivePayoutAssignment[] {
    const out: AdaptivePayoutAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptivePayoutAssignmentStore(): AdaptivePayoutAssignmentStore {
  return new MemoryAdaptivePayoutAssignmentStore(new Map<string, AdaptivePayoutAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptivePayoutAssignmentStore implements AdaptivePayoutAssignmentStore {
  inner: AdaptivePayoutAssignmentStore;
  cache: cache.TtlCache<AdaptivePayoutAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptivePayoutAssignmentStore,
    cacheValue: cache.TtlCache<AdaptivePayoutAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptivePayoutAssignment | undefined {
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

  save(item: AdaptivePayoutAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptivePayoutAssignment[] {
    return this.inner.list();
  }
}

export function newCachedAdaptivePayoutAssignmentStore(inner: AdaptivePayoutAssignmentStore, ttl: number, clockValue: clock.Clock): AdaptivePayoutAssignmentStore {
  return new CachedAdaptivePayoutAssignmentStore(
    inner,
    cache.newTtlCache<AdaptivePayoutAssignment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive payout assignments. Empty fields match all. */
export class AdaptivePayoutAssignmentQuery {
  title: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptivePayoutAssignment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptivePayoutAssignment[]): AdaptivePayoutAssignment[] {
    const matched = collections.filter(items, (candidate: AdaptivePayoutAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptivePayoutAssignments(store: AdaptivePayoutAssignmentStore, query: AdaptivePayoutAssignmentQuery): AdaptivePayoutAssignment[] {
  return query.apply(store.list());
}
