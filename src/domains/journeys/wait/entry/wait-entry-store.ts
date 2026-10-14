import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitEntry } from "./wait-entry.js";

/** Keeps wait entries by code. */
export interface WaitEntryStore {
  find(code: string): WaitEntry | undefined;
  save(item: WaitEntry): void;
  remove(code: string): boolean;
  list(): WaitEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitEntryStore implements WaitEntryStore {
  items: Map<string, WaitEntry>;
  order: string[];

  constructor(items: Map<string, WaitEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitEntry): void {
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

  list(): WaitEntry[] {
    const out: WaitEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitEntryStore(): WaitEntryStore {
  return new MemoryWaitEntryStore(new Map<string, WaitEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitEntryStore implements WaitEntryStore {
  inner: WaitEntryStore;
  cache: cache.TtlCache<WaitEntry>;
  hits: number;
  misses: number;

  constructor(inner: WaitEntryStore, cacheValue: cache.TtlCache<WaitEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitEntry | undefined {
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

  save(item: WaitEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitEntry[] {
    return this.inner.list();
  }
}

export function newCachedWaitEntryStore(inner: WaitEntryStore, ttl: number, clockValue: clock.Clock): WaitEntryStore {
  return new CachedWaitEntryStore(inner, cache.newTtlCache<WaitEntry>(1024, ttl, clockValue), 0, 0);
}

/** Selects wait entries. Empty fields match all. */
export class WaitEntryQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitEntry): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitEntry[]): WaitEntry[] {
    const matched = collections.filter(items, (candidate: WaitEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitEntries(store: WaitEntryStore, query: WaitEntryQuery): WaitEntry[] {
  return query.apply(store.list());
}
