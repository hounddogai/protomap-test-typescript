import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainEntry } from "./domain-entry.js";

/** Keeps domain entries by code. */
export interface DomainEntryStore {
  find(code: string): DomainEntry | undefined;
  save(item: DomainEntry): void;
  remove(code: string): boolean;
  list(): DomainEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainEntryStore implements DomainEntryStore {
  items: Map<string, DomainEntry>;
  order: string[];

  constructor(items: Map<string, DomainEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainEntry): void {
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

  list(): DomainEntry[] {
    const out: DomainEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainEntryStore(): DomainEntryStore {
  return new MemoryDomainEntryStore(new Map<string, DomainEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainEntryStore implements DomainEntryStore {
  inner: DomainEntryStore;
  cache: cache.TtlCache<DomainEntry>;
  hits: number;
  misses: number;

  constructor(inner: DomainEntryStore, cacheValue: cache.TtlCache<DomainEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainEntry | undefined {
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

  save(item: DomainEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainEntry[] {
    return this.inner.list();
  }
}

export function newCachedDomainEntryStore(inner: DomainEntryStore, ttl: number, clockValue: clock.Clock): DomainEntryStore {
  return new CachedDomainEntryStore(inner, cache.newTtlCache<DomainEntry>(512, ttl, clockValue), 0, 0);
}

/** Selects domain entries. Empty fields match all. */
export class DomainEntryQuery {
  region: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minThreshold: number, statuses: string[], limit: number) {
    this.region = region;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainEntry): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainEntry[]): DomainEntry[] {
    const matched = collections.filter(items, (candidate: DomainEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainEntries(store: DomainEntryStore, query: DomainEntryQuery): DomainEntry[] {
  return query.apply(store.list());
}
