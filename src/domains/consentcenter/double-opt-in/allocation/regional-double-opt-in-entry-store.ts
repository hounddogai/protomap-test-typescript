import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalDoubleOptInEntry } from "./regional-double-opt-in-entry.js";

/** Keeps regional double opt in entries by code. */
export interface RegionalDoubleOptInEntryStore {
  find(code: string): RegionalDoubleOptInEntry | undefined;
  save(item: RegionalDoubleOptInEntry): void;
  remove(code: string): boolean;
  list(): RegionalDoubleOptInEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalDoubleOptInEntryStore implements RegionalDoubleOptInEntryStore {
  items: Map<string, RegionalDoubleOptInEntry>;
  order: string[];

  constructor(items: Map<string, RegionalDoubleOptInEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalDoubleOptInEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalDoubleOptInEntry): void {
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

  list(): RegionalDoubleOptInEntry[] {
    const out: RegionalDoubleOptInEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalDoubleOptInEntryStore(): RegionalDoubleOptInEntryStore {
  return new MemoryRegionalDoubleOptInEntryStore(new Map<string, RegionalDoubleOptInEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalDoubleOptInEntryStore implements RegionalDoubleOptInEntryStore {
  inner: RegionalDoubleOptInEntryStore;
  cache: cache.TtlCache<RegionalDoubleOptInEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalDoubleOptInEntryStore,
    cacheValue: cache.TtlCache<RegionalDoubleOptInEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalDoubleOptInEntry | undefined {
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

  save(item: RegionalDoubleOptInEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalDoubleOptInEntry[] {
    return this.inner.list();
  }
}

export function newCachedRegionalDoubleOptInEntryStore(inner: RegionalDoubleOptInEntryStore, ttl: number, clockValue: clock.Clock): RegionalDoubleOptInEntryStore {
  return new CachedRegionalDoubleOptInEntryStore(
    inner,
    cache.newTtlCache<RegionalDoubleOptInEntry>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional double opt in entries. Empty fields match all. */
export class RegionalDoubleOptInEntryQuery {
  label: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRetries: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalDoubleOptInEntry): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalDoubleOptInEntry[]): RegionalDoubleOptInEntry[] {
    const matched = collections.filter(items, (candidate: RegionalDoubleOptInEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalDoubleOptInEntries(store: RegionalDoubleOptInEntryStore, query: RegionalDoubleOptInEntryQuery): RegionalDoubleOptInEntry[] {
  return query.apply(store.list());
}
