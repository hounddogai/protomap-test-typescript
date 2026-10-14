import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionEntry } from "./conversion-entry.js";

/** Keeps conversion entries by code. */
export interface ConversionEntryStore {
  find(code: string): ConversionEntry | undefined;
  save(item: ConversionEntry): void;
  remove(code: string): boolean;
  list(): ConversionEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionEntryStore implements ConversionEntryStore {
  items: Map<string, ConversionEntry>;
  order: string[];

  constructor(items: Map<string, ConversionEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionEntry): void {
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

  list(): ConversionEntry[] {
    const out: ConversionEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionEntryStore(): ConversionEntryStore {
  return new MemoryConversionEntryStore(new Map<string, ConversionEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionEntryStore implements ConversionEntryStore {
  inner: ConversionEntryStore;
  cache: cache.TtlCache<ConversionEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionEntryStore,
    cacheValue: cache.TtlCache<ConversionEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionEntry | undefined {
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

  save(item: ConversionEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionEntry[] {
    return this.inner.list();
  }
}

export function newCachedConversionEntryStore(inner: ConversionEntryStore, ttl: number, clockValue: clock.Clock): ConversionEntryStore {
  return new CachedConversionEntryStore(inner, cache.newTtlCache<ConversionEntry>(128, ttl, clockValue), 0, 0);
}

/** Selects conversion entries. Empty fields match all. */
export class ConversionEntryQuery {
  channel: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minLimit: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionEntry): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionEntry[]): ConversionEntry[] {
    const matched = collections.filter(items, (candidate: ConversionEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionEntries(store: ConversionEntryStore, query: ConversionEntryQuery): ConversionEntry[] {
  return query.apply(store.list());
}
