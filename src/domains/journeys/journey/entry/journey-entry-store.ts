import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyEntry } from "./journey-entry.js";

/** Keeps journey entries by code. */
export interface JourneyEntryStore {
  find(code: string): JourneyEntry | undefined;
  save(item: JourneyEntry): void;
  remove(code: string): boolean;
  list(): JourneyEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyEntryStore implements JourneyEntryStore {
  items: Map<string, JourneyEntry>;
  order: string[];

  constructor(items: Map<string, JourneyEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyEntry): void {
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

  list(): JourneyEntry[] {
    const out: JourneyEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyEntryStore(): JourneyEntryStore {
  return new MemoryJourneyEntryStore(new Map<string, JourneyEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyEntryStore implements JourneyEntryStore {
  inner: JourneyEntryStore;
  cache: cache.TtlCache<JourneyEntry>;
  hits: number;
  misses: number;

  constructor(inner: JourneyEntryStore, cacheValue: cache.TtlCache<JourneyEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyEntry | undefined {
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

  save(item: JourneyEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyEntry[] {
    return this.inner.list();
  }
}

export function newCachedJourneyEntryStore(inner: JourneyEntryStore, ttl: number, clockValue: clock.Clock): JourneyEntryStore {
  return new CachedJourneyEntryStore(inner, cache.newTtlCache<JourneyEntry>(256, ttl, clockValue), 0, 0);
}

/** Selects journey entries. Empty fields match all. */
export class JourneyEntryQuery {
  segment: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minQuantity: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyEntry): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyEntry[]): JourneyEntry[] {
    const matched = collections.filter(items, (candidate: JourneyEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyEntries(store: JourneyEntryStore, query: JourneyEntryQuery): JourneyEntry[] {
  return query.apply(store.list());
}
