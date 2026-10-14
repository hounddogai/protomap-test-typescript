import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultFlightEntry } from "./default-flight-entry.js";

/** Keeps default flight entries by code. */
export interface DefaultFlightEntryStore {
  find(code: string): DefaultFlightEntry | undefined;
  save(item: DefaultFlightEntry): void;
  remove(code: string): boolean;
  list(): DefaultFlightEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultFlightEntryStore implements DefaultFlightEntryStore {
  items: Map<string, DefaultFlightEntry>;
  order: string[];

  constructor(items: Map<string, DefaultFlightEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultFlightEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultFlightEntry): void {
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

  list(): DefaultFlightEntry[] {
    const out: DefaultFlightEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultFlightEntryStore(): DefaultFlightEntryStore {
  return new MemoryDefaultFlightEntryStore(new Map<string, DefaultFlightEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultFlightEntryStore implements DefaultFlightEntryStore {
  inner: DefaultFlightEntryStore;
  cache: cache.TtlCache<DefaultFlightEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultFlightEntryStore,
    cacheValue: cache.TtlCache<DefaultFlightEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultFlightEntry | undefined {
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

  save(item: DefaultFlightEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultFlightEntry[] {
    return this.inner.list();
  }
}

export function newCachedDefaultFlightEntryStore(inner: DefaultFlightEntryStore, ttl: number, clockValue: clock.Clock): DefaultFlightEntryStore {
  return new CachedDefaultFlightEntryStore(inner, cache.newTtlCache<DefaultFlightEntry>(128, ttl, clockValue), 0, 0);
}

/** Selects default flight entries. Empty fields match all. */
export class DefaultFlightEntryQuery {
  region: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minLimit: number, statuses: string[], limit: number) {
    this.region = region;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultFlightEntry): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultFlightEntry[]): DefaultFlightEntry[] {
    const matched = collections.filter(items, (candidate: DefaultFlightEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultFlightEntries(store: DefaultFlightEntryStore, query: DefaultFlightEntryQuery): DefaultFlightEntry[] {
  return query.apply(store.list());
}
