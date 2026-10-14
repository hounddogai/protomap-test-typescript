import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualTierCycle } from "./manual-tier-cycle.js";

/** Keeps manual tier cycles by code. */
export interface ManualTierCycleStore {
  find(code: string): ManualTierCycle | undefined;
  save(item: ManualTierCycle): void;
  remove(code: string): boolean;
  list(): ManualTierCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualTierCycleStore implements ManualTierCycleStore {
  items: Map<string, ManualTierCycle>;
  order: string[];

  constructor(items: Map<string, ManualTierCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualTierCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualTierCycle): void {
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

  list(): ManualTierCycle[] {
    const out: ManualTierCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualTierCycleStore(): ManualTierCycleStore {
  return new MemoryManualTierCycleStore(new Map<string, ManualTierCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualTierCycleStore implements ManualTierCycleStore {
  inner: ManualTierCycleStore;
  cache: cache.TtlCache<ManualTierCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualTierCycleStore,
    cacheValue: cache.TtlCache<ManualTierCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualTierCycle | undefined {
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

  save(item: ManualTierCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualTierCycle[] {
    return this.inner.list();
  }
}

export function newCachedManualTierCycleStore(inner: ManualTierCycleStore, ttl: number, clockValue: clock.Clock): ManualTierCycleStore {
  return new CachedManualTierCycleStore(inner, cache.newTtlCache<ManualTierCycle>(128, ttl, clockValue), 0, 0);
}

/** Selects manual tier cycles. Empty fields match all. */
export class ManualTierCycleQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualTierCycle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualTierCycle[]): ManualTierCycle[] {
    const matched = collections.filter(items, (candidate: ManualTierCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualTierCycles(store: ManualTierCycleStore, query: ManualTierCycleQuery): ManualTierCycle[] {
  return query.apply(store.list());
}
