import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictProofEntry } from "./strict-proof-entry.js";

/** Keeps strict proof entries by code. */
export interface StrictProofEntryStore {
  find(code: string): StrictProofEntry | undefined;
  save(item: StrictProofEntry): void;
  remove(code: string): boolean;
  list(): StrictProofEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictProofEntryStore implements StrictProofEntryStore {
  items: Map<string, StrictProofEntry>;
  order: string[];

  constructor(items: Map<string, StrictProofEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictProofEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictProofEntry): void {
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

  list(): StrictProofEntry[] {
    const out: StrictProofEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictProofEntryStore(): StrictProofEntryStore {
  return new MemoryStrictProofEntryStore(new Map<string, StrictProofEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictProofEntryStore implements StrictProofEntryStore {
  inner: StrictProofEntryStore;
  cache: cache.TtlCache<StrictProofEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictProofEntryStore,
    cacheValue: cache.TtlCache<StrictProofEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictProofEntry | undefined {
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

  save(item: StrictProofEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictProofEntry[] {
    return this.inner.list();
  }
}

export function newCachedStrictProofEntryStore(inner: StrictProofEntryStore, ttl: number, clockValue: clock.Clock): StrictProofEntryStore {
  return new CachedStrictProofEntryStore(inner, cache.newTtlCache<StrictProofEntry>(128, ttl, clockValue), 0, 0);
}

/** Selects strict proof entries. Empty fields match all. */
export class StrictProofEntryQuery {
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

  matches(item: StrictProofEntry): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictProofEntry[]): StrictProofEntry[] {
    const matched = collections.filter(items, (candidate: StrictProofEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictProofEntries(store: StrictProofEntryStore, query: StrictProofEntryQuery): StrictProofEntry[] {
  return query.apply(store.list());
}
