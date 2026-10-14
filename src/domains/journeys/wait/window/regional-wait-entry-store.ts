import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalWaitEntry } from "./regional-wait-entry.js";

/** Keeps regional wait entries by code. */
export interface RegionalWaitEntryStore {
  find(code: string): RegionalWaitEntry | undefined;
  save(item: RegionalWaitEntry): void;
  remove(code: string): boolean;
  list(): RegionalWaitEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalWaitEntryStore implements RegionalWaitEntryStore {
  items: Map<string, RegionalWaitEntry>;
  order: string[];

  constructor(items: Map<string, RegionalWaitEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalWaitEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalWaitEntry): void {
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

  list(): RegionalWaitEntry[] {
    const out: RegionalWaitEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalWaitEntryStore(): RegionalWaitEntryStore {
  return new MemoryRegionalWaitEntryStore(new Map<string, RegionalWaitEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalWaitEntryStore implements RegionalWaitEntryStore {
  inner: RegionalWaitEntryStore;
  cache: cache.TtlCache<RegionalWaitEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalWaitEntryStore,
    cacheValue: cache.TtlCache<RegionalWaitEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalWaitEntry | undefined {
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

  save(item: RegionalWaitEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalWaitEntry[] {
    return this.inner.list();
  }
}

export function newCachedRegionalWaitEntryStore(inner: RegionalWaitEntryStore, ttl: number, clockValue: clock.Clock): RegionalWaitEntryStore {
  return new CachedRegionalWaitEntryStore(inner, cache.newTtlCache<RegionalWaitEntry>(1024, ttl, clockValue), 0, 0);
}

/** Selects regional wait entries. Empty fields match all. */
export class RegionalWaitEntryQuery {
  label: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCeiling: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalWaitEntry): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalWaitEntry[]): RegionalWaitEntry[] {
    const matched = collections.filter(items, (candidate: RegionalWaitEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalWaitEntries(store: RegionalWaitEntryStore, query: RegionalWaitEntryQuery): RegionalWaitEntry[] {
  return query.apply(store.list());
}
