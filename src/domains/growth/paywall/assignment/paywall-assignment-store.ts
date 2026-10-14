import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallAssignment } from "./paywall-assignment.js";

/** Keeps paywall assignments by code. */
export interface PaywallAssignmentStore {
  find(code: string): PaywallAssignment | undefined;
  save(item: PaywallAssignment): void;
  remove(code: string): boolean;
  list(): PaywallAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallAssignmentStore implements PaywallAssignmentStore {
  items: Map<string, PaywallAssignment>;
  order: string[];

  constructor(items: Map<string, PaywallAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallAssignment): void {
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

  list(): PaywallAssignment[] {
    const out: PaywallAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallAssignmentStore(): PaywallAssignmentStore {
  return new MemoryPaywallAssignmentStore(new Map<string, PaywallAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallAssignmentStore implements PaywallAssignmentStore {
  inner: PaywallAssignmentStore;
  cache: cache.TtlCache<PaywallAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: PaywallAssignmentStore,
    cacheValue: cache.TtlCache<PaywallAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallAssignment | undefined {
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

  save(item: PaywallAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallAssignment[] {
    return this.inner.list();
  }
}

export function newCachedPaywallAssignmentStore(inner: PaywallAssignmentStore, ttl: number, clockValue: clock.Clock): PaywallAssignmentStore {
  return new CachedPaywallAssignmentStore(inner, cache.newTtlCache<PaywallAssignment>(512, ttl, clockValue), 0, 0);
}

/** Selects paywall assignments. Empty fields match all. */
export class PaywallAssignmentQuery {
  country: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallAssignment): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallAssignment[]): PaywallAssignment[] {
    const matched = collections.filter(items, (candidate: PaywallAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallAssignments(store: PaywallAssignmentStore, query: PaywallAssignmentQuery): PaywallAssignment[] {
  return query.apply(store.list());
}
