import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutEntry } from "./opt-out-entry.js";

/** Keeps opt out entries by code. */
export interface OptOutEntryStore {
  find(code: string): OptOutEntry | undefined;
  save(item: OptOutEntry): void;
  remove(code: string): boolean;
  list(): OptOutEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutEntryStore implements OptOutEntryStore {
  items: Map<string, OptOutEntry>;
  order: string[];

  constructor(items: Map<string, OptOutEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutEntry): void {
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

  list(): OptOutEntry[] {
    const out: OptOutEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutEntryStore(): OptOutEntryStore {
  return new MemoryOptOutEntryStore(new Map<string, OptOutEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutEntryStore implements OptOutEntryStore {
  inner: OptOutEntryStore;
  cache: cache.TtlCache<OptOutEntry>;
  hits: number;
  misses: number;

  constructor(inner: OptOutEntryStore, cacheValue: cache.TtlCache<OptOutEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutEntry | undefined {
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

  save(item: OptOutEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutEntry[] {
    return this.inner.list();
  }
}

export function newCachedOptOutEntryStore(inner: OptOutEntryStore, ttl: number, clockValue: clock.Clock): OptOutEntryStore {
  return new CachedOptOutEntryStore(inner, cache.newTtlCache<OptOutEntry>(256, ttl, clockValue), 0, 0);
}

/** Selects opt out entries. Empty fields match all. */
export class OptOutEntryQuery {
  country: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutEntry): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutEntry[]): OptOutEntry[] {
    const matched = collections.filter(items, (candidate: OptOutEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutEntries(store: OptOutEntryStore, query: OptOutEntryQuery): OptOutEntry[] {
  return query.apply(store.list());
}
