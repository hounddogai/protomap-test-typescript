import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualLevelEntry } from "./manual-level-entry.js";

/** Keeps manual level entries by code. */
export interface ManualLevelEntryStore {
  find(code: string): ManualLevelEntry | undefined;
  save(item: ManualLevelEntry): void;
  remove(code: string): boolean;
  list(): ManualLevelEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualLevelEntryStore implements ManualLevelEntryStore {
  items: Map<string, ManualLevelEntry>;
  order: string[];

  constructor(items: Map<string, ManualLevelEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualLevelEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualLevelEntry): void {
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

  list(): ManualLevelEntry[] {
    const out: ManualLevelEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualLevelEntryStore(): ManualLevelEntryStore {
  return new MemoryManualLevelEntryStore(new Map<string, ManualLevelEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualLevelEntryStore implements ManualLevelEntryStore {
  inner: ManualLevelEntryStore;
  cache: cache.TtlCache<ManualLevelEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualLevelEntryStore,
    cacheValue: cache.TtlCache<ManualLevelEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualLevelEntry | undefined {
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

  save(item: ManualLevelEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualLevelEntry[] {
    return this.inner.list();
  }
}

export function newCachedManualLevelEntryStore(inner: ManualLevelEntryStore, ttl: number, clockValue: clock.Clock): ManualLevelEntryStore {
  return new CachedManualLevelEntryStore(inner, cache.newTtlCache<ManualLevelEntry>(128, ttl, clockValue), 0, 0);
}

/** Selects manual level entries. Empty fields match all. */
export class ManualLevelEntryQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualLevelEntry): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualLevelEntry[]): ManualLevelEntry[] {
    const matched = collections.filter(items, (candidate: ManualLevelEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualLevelEntries(store: ManualLevelEntryStore, query: ManualLevelEntryQuery): ManualLevelEntry[] {
  return query.apply(store.list());
}
