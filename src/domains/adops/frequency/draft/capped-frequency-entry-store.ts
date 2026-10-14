import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedFrequencyEntry } from "./capped-frequency-entry.js";

/** Keeps capped frequency entries by code. */
export interface CappedFrequencyEntryStore {
  find(code: string): CappedFrequencyEntry | undefined;
  save(item: CappedFrequencyEntry): void;
  remove(code: string): boolean;
  list(): CappedFrequencyEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedFrequencyEntryStore implements CappedFrequencyEntryStore {
  items: Map<string, CappedFrequencyEntry>;
  order: string[];

  constructor(items: Map<string, CappedFrequencyEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedFrequencyEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedFrequencyEntry): void {
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

  list(): CappedFrequencyEntry[] {
    const out: CappedFrequencyEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedFrequencyEntryStore(): CappedFrequencyEntryStore {
  return new MemoryCappedFrequencyEntryStore(new Map<string, CappedFrequencyEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedFrequencyEntryStore implements CappedFrequencyEntryStore {
  inner: CappedFrequencyEntryStore;
  cache: cache.TtlCache<CappedFrequencyEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedFrequencyEntryStore,
    cacheValue: cache.TtlCache<CappedFrequencyEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedFrequencyEntry | undefined {
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

  save(item: CappedFrequencyEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedFrequencyEntry[] {
    return this.inner.list();
  }
}

export function newCachedCappedFrequencyEntryStore(inner: CappedFrequencyEntryStore, ttl: number, clockValue: clock.Clock): CappedFrequencyEntryStore {
  return new CachedCappedFrequencyEntryStore(
    inner,
    cache.newTtlCache<CappedFrequencyEntry>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped frequency entries. Empty fields match all. */
export class CappedFrequencyEntryQuery {
  locale: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minPriority: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedFrequencyEntry): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedFrequencyEntry[]): CappedFrequencyEntry[] {
    const matched = collections.filter(items, (candidate: CappedFrequencyEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedFrequencyEntries(store: CappedFrequencyEntryStore, query: CappedFrequencyEntryQuery): CappedFrequencyEntry[] {
  return query.apply(store.list());
}
