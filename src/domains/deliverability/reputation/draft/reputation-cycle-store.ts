import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationCycle } from "./reputation-cycle.js";

/** Keeps reputation cycles by code. */
export interface ReputationCycleStore {
  find(code: string): ReputationCycle | undefined;
  save(item: ReputationCycle): void;
  remove(code: string): boolean;
  list(): ReputationCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationCycleStore implements ReputationCycleStore {
  items: Map<string, ReputationCycle>;
  order: string[];

  constructor(items: Map<string, ReputationCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationCycle): void {
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

  list(): ReputationCycle[] {
    const out: ReputationCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationCycleStore(): ReputationCycleStore {
  return new MemoryReputationCycleStore(new Map<string, ReputationCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationCycleStore implements ReputationCycleStore {
  inner: ReputationCycleStore;
  cache: cache.TtlCache<ReputationCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationCycleStore,
    cacheValue: cache.TtlCache<ReputationCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationCycle | undefined {
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

  save(item: ReputationCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationCycle[] {
    return this.inner.list();
  }
}

export function newCachedReputationCycleStore(inner: ReputationCycleStore, ttl: number, clockValue: clock.Clock): ReputationCycleStore {
  return new CachedReputationCycleStore(inner, cache.newTtlCache<ReputationCycle>(256, ttl, clockValue), 0, 0);
}

/** Selects reputation cycles. Empty fields match all. */
export class ReputationCycleQuery {
  title: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRatio: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationCycle): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationCycle[]): ReputationCycle[] {
    const matched = collections.filter(items, (candidate: ReputationCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationCycles(store: ReputationCycleStore, query: ReputationCycleQuery): ReputationCycle[] {
  return query.apply(store.list());
}
