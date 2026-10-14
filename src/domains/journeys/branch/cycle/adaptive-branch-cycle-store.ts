import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveBranchCycle } from "./adaptive-branch-cycle.js";

/** Keeps adaptive branch cycles by code. */
export interface AdaptiveBranchCycleStore {
  find(code: string): AdaptiveBranchCycle | undefined;
  save(item: AdaptiveBranchCycle): void;
  remove(code: string): boolean;
  list(): AdaptiveBranchCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveBranchCycleStore implements AdaptiveBranchCycleStore {
  items: Map<string, AdaptiveBranchCycle>;
  order: string[];

  constructor(items: Map<string, AdaptiveBranchCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveBranchCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveBranchCycle): void {
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

  list(): AdaptiveBranchCycle[] {
    const out: AdaptiveBranchCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveBranchCycleStore(): AdaptiveBranchCycleStore {
  return new MemoryAdaptiveBranchCycleStore(new Map<string, AdaptiveBranchCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveBranchCycleStore implements AdaptiveBranchCycleStore {
  inner: AdaptiveBranchCycleStore;
  cache: cache.TtlCache<AdaptiveBranchCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveBranchCycleStore,
    cacheValue: cache.TtlCache<AdaptiveBranchCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveBranchCycle | undefined {
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

  save(item: AdaptiveBranchCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveBranchCycle[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveBranchCycleStore(inner: AdaptiveBranchCycleStore, ttl: number, clockValue: clock.Clock): AdaptiveBranchCycleStore {
  return new CachedAdaptiveBranchCycleStore(inner, cache.newTtlCache<AdaptiveBranchCycle>(1024, ttl, clockValue), 0, 0);
}

/** Selects adaptive branch cycles. Empty fields match all. */
export class AdaptiveBranchCycleQuery {
  channel: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveBranchCycle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveBranchCycle[]): AdaptiveBranchCycle[] {
    const matched = collections.filter(items, (candidate: AdaptiveBranchCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveBranchCycles(store: AdaptiveBranchCycleStore, query: AdaptiveBranchCycleQuery): AdaptiveBranchCycle[] {
  return query.apply(store.list());
}
