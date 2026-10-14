import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchEntry } from "./branch-entry.js";

/** Keeps branch entries by code. */
export interface BranchEntryStore {
  find(code: string): BranchEntry | undefined;
  save(item: BranchEntry): void;
  remove(code: string): boolean;
  list(): BranchEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchEntryStore implements BranchEntryStore {
  items: Map<string, BranchEntry>;
  order: string[];

  constructor(items: Map<string, BranchEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchEntry): void {
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

  list(): BranchEntry[] {
    const out: BranchEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchEntryStore(): BranchEntryStore {
  return new MemoryBranchEntryStore(new Map<string, BranchEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchEntryStore implements BranchEntryStore {
  inner: BranchEntryStore;
  cache: cache.TtlCache<BranchEntry>;
  hits: number;
  misses: number;

  constructor(inner: BranchEntryStore, cacheValue: cache.TtlCache<BranchEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchEntry | undefined {
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

  save(item: BranchEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchEntry[] {
    return this.inner.list();
  }
}

export function newCachedBranchEntryStore(inner: BranchEntryStore, ttl: number, clockValue: clock.Clock): BranchEntryStore {
  return new CachedBranchEntryStore(inner, cache.newTtlCache<BranchEntry>(1024, ttl, clockValue), 0, 0);
}

/** Selects branch entries. Empty fields match all. */
export class BranchEntryQuery {
  channel: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCost: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchEntry): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchEntry[]): BranchEntry[] {
    const matched = collections.filter(items, (candidate: BranchEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchEntries(store: BranchEntryStore, query: BranchEntryQuery): BranchEntry[] {
  return query.apply(store.list());
}
