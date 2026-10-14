import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingStepEntry } from "./rolling-step-entry.js";

/** Keeps rolling step entries by code. */
export interface RollingStepEntryStore {
  find(code: string): RollingStepEntry | undefined;
  save(item: RollingStepEntry): void;
  remove(code: string): boolean;
  list(): RollingStepEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingStepEntryStore implements RollingStepEntryStore {
  items: Map<string, RollingStepEntry>;
  order: string[];

  constructor(items: Map<string, RollingStepEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingStepEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingStepEntry): void {
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

  list(): RollingStepEntry[] {
    const out: RollingStepEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingStepEntryStore(): RollingStepEntryStore {
  return new MemoryRollingStepEntryStore(new Map<string, RollingStepEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingStepEntryStore implements RollingStepEntryStore {
  inner: RollingStepEntryStore;
  cache: cache.TtlCache<RollingStepEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingStepEntryStore,
    cacheValue: cache.TtlCache<RollingStepEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingStepEntry | undefined {
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

  save(item: RollingStepEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingStepEntry[] {
    return this.inner.list();
  }
}

export function newCachedRollingStepEntryStore(inner: RollingStepEntryStore, ttl: number, clockValue: clock.Clock): RollingStepEntryStore {
  return new CachedRollingStepEntryStore(inner, cache.newTtlCache<RollingStepEntry>(1024, ttl, clockValue), 0, 0);
}

/** Selects rolling step entries. Empty fields match all. */
export class RollingStepEntryQuery {
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

  matches(item: RollingStepEntry): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingStepEntry[]): RollingStepEntry[] {
    const matched = collections.filter(items, (candidate: RollingStepEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingStepEntries(store: RollingStepEntryStore, query: RollingStepEntryQuery): RollingStepEntry[] {
  return query.apply(store.list());
}
