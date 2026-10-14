import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryMacroEntry } from "./primary-macro-entry.js";

/** Keeps primary macro entries by code. */
export interface PrimaryMacroEntryStore {
  find(code: string): PrimaryMacroEntry | undefined;
  save(item: PrimaryMacroEntry): void;
  remove(code: string): boolean;
  list(): PrimaryMacroEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryMacroEntryStore implements PrimaryMacroEntryStore {
  items: Map<string, PrimaryMacroEntry>;
  order: string[];

  constructor(items: Map<string, PrimaryMacroEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryMacroEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryMacroEntry): void {
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

  list(): PrimaryMacroEntry[] {
    const out: PrimaryMacroEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryMacroEntryStore(): PrimaryMacroEntryStore {
  return new MemoryPrimaryMacroEntryStore(new Map<string, PrimaryMacroEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryMacroEntryStore implements PrimaryMacroEntryStore {
  inner: PrimaryMacroEntryStore;
  cache: cache.TtlCache<PrimaryMacroEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryMacroEntryStore,
    cacheValue: cache.TtlCache<PrimaryMacroEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryMacroEntry | undefined {
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

  save(item: PrimaryMacroEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryMacroEntry[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryMacroEntryStore(inner: PrimaryMacroEntryStore, ttl: number, clockValue: clock.Clock): PrimaryMacroEntryStore {
  return new CachedPrimaryMacroEntryStore(inner, cache.newTtlCache<PrimaryMacroEntry>(64, ttl, clockValue), 0, 0);
}

/** Selects primary macro entries. Empty fields match all. */
export class PrimaryMacroEntryQuery {
  source: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRevision: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryMacroEntry): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryMacroEntry[]): PrimaryMacroEntry[] {
    const matched = collections.filter(items, (candidate: PrimaryMacroEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryMacroEntries(store: PrimaryMacroEntryStore, query: PrimaryMacroEntryQuery): PrimaryMacroEntry[] {
  return query.apply(store.list());
}
