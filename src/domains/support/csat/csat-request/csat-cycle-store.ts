import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatCycle } from "./csat-cycle.js";

/** Keeps csat cycles by code. */
export interface CsatCycleStore {
  find(code: string): CsatCycle | undefined;
  save(item: CsatCycle): void;
  remove(code: string): boolean;
  list(): CsatCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatCycleStore implements CsatCycleStore {
  items: Map<string, CsatCycle>;
  order: string[];

  constructor(items: Map<string, CsatCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatCycle): void {
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

  list(): CsatCycle[] {
    const out: CsatCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatCycleStore(): CsatCycleStore {
  return new MemoryCsatCycleStore(new Map<string, CsatCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatCycleStore implements CsatCycleStore {
  inner: CsatCycleStore;
  cache: cache.TtlCache<CsatCycle>;
  hits: number;
  misses: number;

  constructor(inner: CsatCycleStore, cacheValue: cache.TtlCache<CsatCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatCycle | undefined {
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

  save(item: CsatCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatCycle[] {
    return this.inner.list();
  }
}

export function newCachedCsatCycleStore(inner: CsatCycleStore, ttl: number, clockValue: clock.Clock): CsatCycleStore {
  return new CachedCsatCycleStore(inner, cache.newTtlCache<CsatCycle>(128, ttl, clockValue), 0, 0);
}

/** Selects csat cycles. Empty fields match all. */
export class CsatCycleQuery {
  name: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBatchSize: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatCycle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatCycle[]): CsatCycle[] {
    const matched = collections.filter(items, (candidate: CsatCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatCycles(store: CsatCycleStore, query: CsatCycleQuery): CsatCycle[] {
  return query.apply(store.list());
}
