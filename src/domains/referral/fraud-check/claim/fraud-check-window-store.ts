import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckWindow } from "./fraud-check-window.js";

/** Keeps fraud check windows by code. */
export interface FraudCheckWindowStore {
  find(code: string): FraudCheckWindow | undefined;
  save(item: FraudCheckWindow): void;
  remove(code: string): boolean;
  list(): FraudCheckWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckWindowStore implements FraudCheckWindowStore {
  items: Map<string, FraudCheckWindow>;
  order: string[];

  constructor(items: Map<string, FraudCheckWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckWindow): void {
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

  list(): FraudCheckWindow[] {
    const out: FraudCheckWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckWindowStore(): FraudCheckWindowStore {
  return new MemoryFraudCheckWindowStore(new Map<string, FraudCheckWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckWindowStore implements FraudCheckWindowStore {
  inner: FraudCheckWindowStore;
  cache: cache.TtlCache<FraudCheckWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckWindowStore,
    cacheValue: cache.TtlCache<FraudCheckWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckWindow | undefined {
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

  save(item: FraudCheckWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckWindow[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckWindowStore(inner: FraudCheckWindowStore, ttl: number, clockValue: clock.Clock): FraudCheckWindowStore {
  return new CachedFraudCheckWindowStore(inner, cache.newTtlCache<FraudCheckWindow>(64, ttl, clockValue), 0, 0);
}

/** Selects fraud check windows. Empty fields match all. */
export class FraudCheckWindowQuery {
  name: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minPriority: number, statuses: string[], limit: number) {
    this.name = name;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckWindow): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckWindow[]): FraudCheckWindow[] {
    const matched = collections.filter(items, (candidate: FraudCheckWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckWindows(store: FraudCheckWindowStore, query: FraudCheckWindowQuery): FraudCheckWindow[] {
  return query.apply(store.list());
}
