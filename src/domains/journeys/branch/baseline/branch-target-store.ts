import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchTarget } from "./branch-target.js";

/** Keeps branch targets by code. */
export interface BranchTargetStore {
  find(code: string): BranchTarget | undefined;
  save(item: BranchTarget): void;
  remove(code: string): boolean;
  list(): BranchTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchTargetStore implements BranchTargetStore {
  items: Map<string, BranchTarget>;
  order: string[];

  constructor(items: Map<string, BranchTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchTarget): void {
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

  list(): BranchTarget[] {
    const out: BranchTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchTargetStore(): BranchTargetStore {
  return new MemoryBranchTargetStore(new Map<string, BranchTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchTargetStore implements BranchTargetStore {
  inner: BranchTargetStore;
  cache: cache.TtlCache<BranchTarget>;
  hits: number;
  misses: number;

  constructor(inner: BranchTargetStore, cacheValue: cache.TtlCache<BranchTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchTarget | undefined {
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

  save(item: BranchTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchTarget[] {
    return this.inner.list();
  }
}

export function newCachedBranchTargetStore(inner: BranchTargetStore, ttl: number, clockValue: clock.Clock): BranchTargetStore {
  return new CachedBranchTargetStore(inner, cache.newTtlCache<BranchTarget>(1024, ttl, clockValue), 0, 0);
}

/** Selects branch targets. Empty fields match all. */
export class BranchTargetQuery {
  region: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.region = region;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchTarget): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchTarget[]): BranchTarget[] {
    const matched = collections.filter(items, (candidate: BranchTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchTargets(store: BranchTargetStore, query: BranchTargetQuery): BranchTarget[] {
  return query.apply(store.list());
}
