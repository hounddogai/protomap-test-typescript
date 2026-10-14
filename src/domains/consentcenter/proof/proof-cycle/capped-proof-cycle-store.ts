import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedProofCycle } from "./capped-proof-cycle.js";

/** Keeps capped proof cycles by code. */
export interface CappedProofCycleStore {
  find(code: string): CappedProofCycle | undefined;
  save(item: CappedProofCycle): void;
  remove(code: string): boolean;
  list(): CappedProofCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedProofCycleStore implements CappedProofCycleStore {
  items: Map<string, CappedProofCycle>;
  order: string[];

  constructor(items: Map<string, CappedProofCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedProofCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedProofCycle): void {
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

  list(): CappedProofCycle[] {
    const out: CappedProofCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedProofCycleStore(): CappedProofCycleStore {
  return new MemoryCappedProofCycleStore(new Map<string, CappedProofCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedProofCycleStore implements CappedProofCycleStore {
  inner: CappedProofCycleStore;
  cache: cache.TtlCache<CappedProofCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedProofCycleStore,
    cacheValue: cache.TtlCache<CappedProofCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedProofCycle | undefined {
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

  save(item: CappedProofCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedProofCycle[] {
    return this.inner.list();
  }
}

export function newCachedCappedProofCycleStore(inner: CappedProofCycleStore, ttl: number, clockValue: clock.Clock): CappedProofCycleStore {
  return new CachedCappedProofCycleStore(inner, cache.newTtlCache<CappedProofCycle>(512, ttl, clockValue), 0, 0);
}

/** Selects capped proof cycles. Empty fields match all. */
export class CappedProofCycleQuery {
  category: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minPriority: number, statuses: string[], limit: number) {
    this.category = category;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedProofCycle): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedProofCycle[]): CappedProofCycle[] {
    const matched = collections.filter(items, (candidate: CappedProofCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedProofCycles(store: CappedProofCycleStore, query: CappedProofCycleQuery): CappedProofCycle[] {
  return query.apply(store.list());
}
