import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedDomainEntry } from "./capped-domain-entry.js";

/** Keeps capped domain entries by code. */
export interface CappedDomainEntryStore {
  find(code: string): CappedDomainEntry | undefined;
  save(item: CappedDomainEntry): void;
  remove(code: string): boolean;
  list(): CappedDomainEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedDomainEntryStore implements CappedDomainEntryStore {
  items: Map<string, CappedDomainEntry>;
  order: string[];

  constructor(items: Map<string, CappedDomainEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedDomainEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedDomainEntry): void {
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

  list(): CappedDomainEntry[] {
    const out: CappedDomainEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedDomainEntryStore(): CappedDomainEntryStore {
  return new MemoryCappedDomainEntryStore(new Map<string, CappedDomainEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedDomainEntryStore implements CappedDomainEntryStore {
  inner: CappedDomainEntryStore;
  cache: cache.TtlCache<CappedDomainEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedDomainEntryStore,
    cacheValue: cache.TtlCache<CappedDomainEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedDomainEntry | undefined {
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

  save(item: CappedDomainEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedDomainEntry[] {
    return this.inner.list();
  }
}

export function newCachedCappedDomainEntryStore(inner: CappedDomainEntryStore, ttl: number, clockValue: clock.Clock): CappedDomainEntryStore {
  return new CachedCappedDomainEntryStore(inner, cache.newTtlCache<CappedDomainEntry>(64, ttl, clockValue), 0, 0);
}

/** Selects capped domain entries. Empty fields match all. */
export class CappedDomainEntryQuery {
  channel: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minConversionRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedDomainEntry): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedDomainEntry[]): CappedDomainEntry[] {
    const matched = collections.filter(items, (candidate: CappedDomainEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedDomainEntries(store: CappedDomainEntryStore, query: CappedDomainEntryQuery): CappedDomainEntry[] {
  return query.apply(store.list());
}
