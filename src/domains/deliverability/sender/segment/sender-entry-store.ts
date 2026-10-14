import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderEntry } from "./sender-entry.js";

/** Keeps sender entries by code. */
export interface SenderEntryStore {
  find(code: string): SenderEntry | undefined;
  save(item: SenderEntry): void;
  remove(code: string): boolean;
  list(): SenderEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderEntryStore implements SenderEntryStore {
  items: Map<string, SenderEntry>;
  order: string[];

  constructor(items: Map<string, SenderEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderEntry): void {
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

  list(): SenderEntry[] {
    const out: SenderEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderEntryStore(): SenderEntryStore {
  return new MemorySenderEntryStore(new Map<string, SenderEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderEntryStore implements SenderEntryStore {
  inner: SenderEntryStore;
  cache: cache.TtlCache<SenderEntry>;
  hits: number;
  misses: number;

  constructor(inner: SenderEntryStore, cacheValue: cache.TtlCache<SenderEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderEntry | undefined {
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

  save(item: SenderEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderEntry[] {
    return this.inner.list();
  }
}

export function newCachedSenderEntryStore(inner: SenderEntryStore, ttl: number, clockValue: clock.Clock): SenderEntryStore {
  return new CachedSenderEntryStore(inner, cache.newTtlCache<SenderEntry>(128, ttl, clockValue), 0, 0);
}

/** Selects sender entries. Empty fields match all. */
export class SenderEntryQuery {
  channel: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minVersion: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderEntry): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderEntry[]): SenderEntry[] {
    const matched = collections.filter(items, (candidate: SenderEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderEntries(store: SenderEntryStore, query: SenderEntryQuery): SenderEntry[] {
  return query.apply(store.list());
}
