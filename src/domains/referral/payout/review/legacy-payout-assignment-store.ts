import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPayoutAssignment } from "./legacy-payout-assignment.js";

/** Keeps legacy payout assignments by code. */
export interface LegacyPayoutAssignmentStore {
  find(code: string): LegacyPayoutAssignment | undefined;
  save(item: LegacyPayoutAssignment): void;
  remove(code: string): boolean;
  list(): LegacyPayoutAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPayoutAssignmentStore implements LegacyPayoutAssignmentStore {
  items: Map<string, LegacyPayoutAssignment>;
  order: string[];

  constructor(items: Map<string, LegacyPayoutAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPayoutAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPayoutAssignment): void {
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

  list(): LegacyPayoutAssignment[] {
    const out: LegacyPayoutAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPayoutAssignmentStore(): LegacyPayoutAssignmentStore {
  return new MemoryLegacyPayoutAssignmentStore(new Map<string, LegacyPayoutAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPayoutAssignmentStore implements LegacyPayoutAssignmentStore {
  inner: LegacyPayoutAssignmentStore;
  cache: cache.TtlCache<LegacyPayoutAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPayoutAssignmentStore,
    cacheValue: cache.TtlCache<LegacyPayoutAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPayoutAssignment | undefined {
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

  save(item: LegacyPayoutAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPayoutAssignment[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPayoutAssignmentStore(inner: LegacyPayoutAssignmentStore, ttl: number, clockValue: clock.Clock): LegacyPayoutAssignmentStore {
  return new CachedLegacyPayoutAssignmentStore(
    inner,
    cache.newTtlCache<LegacyPayoutAssignment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy payout assignments. Empty fields match all. */
export class LegacyPayoutAssignmentQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPayoutAssignment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPayoutAssignment[]): LegacyPayoutAssignment[] {
    const matched = collections.filter(items, (candidate: LegacyPayoutAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPayoutAssignments(store: LegacyPayoutAssignmentStore, query: LegacyPayoutAssignmentQuery): LegacyPayoutAssignment[] {
  return query.apply(store.list());
}
