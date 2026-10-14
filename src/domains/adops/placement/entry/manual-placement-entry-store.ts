import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPlacementEntry } from "./manual-placement-entry.js";

/** Keeps manual placement entries by code. */
export interface ManualPlacementEntryStore {
  find(code: string): ManualPlacementEntry | undefined;
  save(item: ManualPlacementEntry): void;
  remove(code: string): boolean;
  list(): ManualPlacementEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPlacementEntryStore implements ManualPlacementEntryStore {
  items: Map<string, ManualPlacementEntry>;
  order: string[];

  constructor(items: Map<string, ManualPlacementEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPlacementEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPlacementEntry): void {
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

  list(): ManualPlacementEntry[] {
    const out: ManualPlacementEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPlacementEntryStore(): ManualPlacementEntryStore {
  return new MemoryManualPlacementEntryStore(new Map<string, ManualPlacementEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPlacementEntryStore implements ManualPlacementEntryStore {
  inner: ManualPlacementEntryStore;
  cache: cache.TtlCache<ManualPlacementEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPlacementEntryStore,
    cacheValue: cache.TtlCache<ManualPlacementEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPlacementEntry | undefined {
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

  save(item: ManualPlacementEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPlacementEntry[] {
    return this.inner.list();
  }
}

export function newCachedManualPlacementEntryStore(inner: ManualPlacementEntryStore, ttl: number, clockValue: clock.Clock): ManualPlacementEntryStore {
  return new CachedManualPlacementEntryStore(
    inner,
    cache.newTtlCache<ManualPlacementEntry>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual placement entries. Empty fields match all. */
export class ManualPlacementEntryQuery {
  source: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minVersion: number, statuses: string[], limit: number) {
    this.source = source;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPlacementEntry): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPlacementEntry[]): ManualPlacementEntry[] {
    const matched = collections.filter(items, (candidate: ManualPlacementEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPlacementEntries(store: ManualPlacementEntryStore, query: ManualPlacementEntryQuery): ManualPlacementEntry[] {
  return query.apply(store.list());
}
