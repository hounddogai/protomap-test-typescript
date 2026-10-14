import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPaywallCycle } from "./capped-paywall-cycle.js";

/** Keeps capped paywall cycles by code. */
export interface CappedPaywallCycleStore {
  find(code: string): CappedPaywallCycle | undefined;
  save(item: CappedPaywallCycle): void;
  remove(code: string): boolean;
  list(): CappedPaywallCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPaywallCycleStore implements CappedPaywallCycleStore {
  items: Map<string, CappedPaywallCycle>;
  order: string[];

  constructor(items: Map<string, CappedPaywallCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPaywallCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPaywallCycle): void {
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

  list(): CappedPaywallCycle[] {
    const out: CappedPaywallCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPaywallCycleStore(): CappedPaywallCycleStore {
  return new MemoryCappedPaywallCycleStore(new Map<string, CappedPaywallCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPaywallCycleStore implements CappedPaywallCycleStore {
  inner: CappedPaywallCycleStore;
  cache: cache.TtlCache<CappedPaywallCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPaywallCycleStore,
    cacheValue: cache.TtlCache<CappedPaywallCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPaywallCycle | undefined {
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

  save(item: CappedPaywallCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPaywallCycle[] {
    return this.inner.list();
  }
}

export function newCachedCappedPaywallCycleStore(inner: CappedPaywallCycleStore, ttl: number, clockValue: clock.Clock): CappedPaywallCycleStore {
  return new CachedCappedPaywallCycleStore(inner, cache.newTtlCache<CappedPaywallCycle>(64, ttl, clockValue), 0, 0);
}

/** Selects capped paywall cycles. Empty fields match all. */
export class CappedPaywallCycleQuery {
  name: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCost: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPaywallCycle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPaywallCycle[]): CappedPaywallCycle[] {
    const matched = collections.filter(items, (candidate: CappedPaywallCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPaywallCycles(store: CappedPaywallCycleStore, query: CappedPaywallCycleQuery): CappedPaywallCycle[] {
  return query.apply(store.list());
}
