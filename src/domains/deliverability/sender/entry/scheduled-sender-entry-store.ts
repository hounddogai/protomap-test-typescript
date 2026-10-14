import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledSenderEntry } from "./scheduled-sender-entry.js";

/** Keeps scheduled sender entries by code. */
export interface ScheduledSenderEntryStore {
  find(code: string): ScheduledSenderEntry | undefined;
  save(item: ScheduledSenderEntry): void;
  remove(code: string): boolean;
  list(): ScheduledSenderEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledSenderEntryStore implements ScheduledSenderEntryStore {
  items: Map<string, ScheduledSenderEntry>;
  order: string[];

  constructor(items: Map<string, ScheduledSenderEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledSenderEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledSenderEntry): void {
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

  list(): ScheduledSenderEntry[] {
    const out: ScheduledSenderEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledSenderEntryStore(): ScheduledSenderEntryStore {
  return new MemoryScheduledSenderEntryStore(new Map<string, ScheduledSenderEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledSenderEntryStore implements ScheduledSenderEntryStore {
  inner: ScheduledSenderEntryStore;
  cache: cache.TtlCache<ScheduledSenderEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledSenderEntryStore,
    cacheValue: cache.TtlCache<ScheduledSenderEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledSenderEntry | undefined {
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

  save(item: ScheduledSenderEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledSenderEntry[] {
    return this.inner.list();
  }
}

export function newCachedScheduledSenderEntryStore(inner: ScheduledSenderEntryStore, ttl: number, clockValue: clock.Clock): ScheduledSenderEntryStore {
  return new CachedScheduledSenderEntryStore(
    inner,
    cache.newTtlCache<ScheduledSenderEntry>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled sender entries. Empty fields match all. */
export class ScheduledSenderEntryQuery {
  locale: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBatchSize: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledSenderEntry): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledSenderEntry[]): ScheduledSenderEntry[] {
    const matched = collections.filter(items, (candidate: ScheduledSenderEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledSenderEntries(store: ScheduledSenderEntryStore, query: ScheduledSenderEntryQuery): ScheduledSenderEntry[] {
  return query.apply(store.list());
}
