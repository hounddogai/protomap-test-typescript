import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalModelEntry } from "./regional-model-entry.js";

/** Keeps regional model entries by code. */
export interface RegionalModelEntryStore {
  find(code: string): RegionalModelEntry | undefined;
  save(item: RegionalModelEntry): void;
  remove(code: string): boolean;
  list(): RegionalModelEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalModelEntryStore implements RegionalModelEntryStore {
  items: Map<string, RegionalModelEntry>;
  order: string[];

  constructor(items: Map<string, RegionalModelEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalModelEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalModelEntry): void {
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

  list(): RegionalModelEntry[] {
    const out: RegionalModelEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalModelEntryStore(): RegionalModelEntryStore {
  return new MemoryRegionalModelEntryStore(new Map<string, RegionalModelEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalModelEntryStore implements RegionalModelEntryStore {
  inner: RegionalModelEntryStore;
  cache: cache.TtlCache<RegionalModelEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalModelEntryStore,
    cacheValue: cache.TtlCache<RegionalModelEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalModelEntry | undefined {
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

  save(item: RegionalModelEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalModelEntry[] {
    return this.inner.list();
  }
}

export function newCachedRegionalModelEntryStore(inner: RegionalModelEntryStore, ttl: number, clockValue: clock.Clock): RegionalModelEntryStore {
  return new CachedRegionalModelEntryStore(inner, cache.newTtlCache<RegionalModelEntry>(1024, ttl, clockValue), 0, 0);
}

/** Selects regional model entries. Empty fields match all. */
export class RegionalModelEntryQuery {
  title: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minQuantity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalModelEntry): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalModelEntry[]): RegionalModelEntry[] {
    const matched = collections.filter(items, (candidate: RegionalModelEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalModelEntries(store: RegionalModelEntryStore, query: RegionalModelEntryQuery): RegionalModelEntry[] {
  return query.apply(store.list());
}
