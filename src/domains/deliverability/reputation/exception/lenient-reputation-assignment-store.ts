import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientReputationAssignment } from "./lenient-reputation-assignment.js";

/** Keeps lenient reputation assignments by code. */
export interface LenientReputationAssignmentStore {
  find(code: string): LenientReputationAssignment | undefined;
  save(item: LenientReputationAssignment): void;
  remove(code: string): boolean;
  list(): LenientReputationAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientReputationAssignmentStore implements LenientReputationAssignmentStore {
  items: Map<string, LenientReputationAssignment>;
  order: string[];

  constructor(items: Map<string, LenientReputationAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientReputationAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientReputationAssignment): void {
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

  list(): LenientReputationAssignment[] {
    const out: LenientReputationAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientReputationAssignmentStore(): LenientReputationAssignmentStore {
  return new MemoryLenientReputationAssignmentStore(new Map<string, LenientReputationAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientReputationAssignmentStore implements LenientReputationAssignmentStore {
  inner: LenientReputationAssignmentStore;
  cache: cache.TtlCache<LenientReputationAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientReputationAssignmentStore,
    cacheValue: cache.TtlCache<LenientReputationAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientReputationAssignment | undefined {
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

  save(item: LenientReputationAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientReputationAssignment[] {
    return this.inner.list();
  }
}

export function newCachedLenientReputationAssignmentStore(inner: LenientReputationAssignmentStore, ttl: number, clockValue: clock.Clock): LenientReputationAssignmentStore {
  return new CachedLenientReputationAssignmentStore(
    inner,
    cache.newTtlCache<LenientReputationAssignment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient reputation assignments. Empty fields match all. */
export class LenientReputationAssignmentQuery {
  name: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minOpenRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientReputationAssignment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientReputationAssignment[]): LenientReputationAssignment[] {
    const matched = collections.filter(items, (candidate: LenientReputationAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientReputationAssignments(store: LenientReputationAssignmentStore, query: LenientReputationAssignmentQuery): LenientReputationAssignment[] {
  return query.apply(store.list());
}
