import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchWindow } from "./branch-window.js";

/** Keeps branch windows by code. */
export interface BranchWindowStore {
  find(code: string): BranchWindow | undefined;
  save(item: BranchWindow): void;
  remove(code: string): boolean;
  list(): BranchWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchWindowStore implements BranchWindowStore {
  items: Map<string, BranchWindow>;
  order: string[];

  constructor(items: Map<string, BranchWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchWindow): void {
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

  list(): BranchWindow[] {
    const out: BranchWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchWindowStore(): BranchWindowStore {
  return new MemoryBranchWindowStore(new Map<string, BranchWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchWindowStore implements BranchWindowStore {
  inner: BranchWindowStore;
  cache: cache.TtlCache<BranchWindow>;
  hits: number;
  misses: number;

  constructor(inner: BranchWindowStore, cacheValue: cache.TtlCache<BranchWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchWindow | undefined {
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

  save(item: BranchWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchWindow[] {
    return this.inner.list();
  }
}

export function newCachedBranchWindowStore(inner: BranchWindowStore, ttl: number, clockValue: clock.Clock): BranchWindowStore {
  return new CachedBranchWindowStore(inner, cache.newTtlCache<BranchWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects branch windows. Empty fields match all. */
export class BranchWindowQuery {
  unit: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchWindow): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchWindow[]): BranchWindow[] {
    const matched = collections.filter(items, (candidate: BranchWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchWindows(store: BranchWindowStore, query: BranchWindowQuery): BranchWindow[] {
  return query.apply(store.list());
}
