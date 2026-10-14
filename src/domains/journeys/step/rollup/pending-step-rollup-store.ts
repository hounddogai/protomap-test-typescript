import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingStepRollup } from "./pending-step-rollup.js";

/** Keeps pending step rollups by code. */
export interface PendingStepRollupStore {
  find(code: string): PendingStepRollup | undefined;
  save(item: PendingStepRollup): void;
  remove(code: string): boolean;
  list(): PendingStepRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingStepRollupStore implements PendingStepRollupStore {
  items: Map<string, PendingStepRollup>;
  order: string[];

  constructor(items: Map<string, PendingStepRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingStepRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingStepRollup): void {
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

  list(): PendingStepRollup[] {
    const out: PendingStepRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingStepRollupStore(): PendingStepRollupStore {
  return new MemoryPendingStepRollupStore(new Map<string, PendingStepRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingStepRollupStore implements PendingStepRollupStore {
  inner: PendingStepRollupStore;
  cache: cache.TtlCache<PendingStepRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingStepRollupStore,
    cacheValue: cache.TtlCache<PendingStepRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingStepRollup | undefined {
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

  save(item: PendingStepRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingStepRollup[] {
    return this.inner.list();
  }
}

export function newCachedPendingStepRollupStore(inner: PendingStepRollupStore, ttl: number, clockValue: clock.Clock): PendingStepRollupStore {
  return new CachedPendingStepRollupStore(inner, cache.newTtlCache<PendingStepRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects pending step rollups. Empty fields match all. */
export class PendingStepRollupQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingStepRollup): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingStepRollup[]): PendingStepRollup[] {
    const matched = collections.filter(items, (candidate: PendingStepRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingStepRollups(store: PendingStepRollupStore, query: PendingStepRollupQuery): PendingStepRollup[] {
  return query.apply(store.list());
}
