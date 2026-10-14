import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalRewardEntry } from "./global-reward-entry.js";

/** Keeps global reward entries by code. */
export interface GlobalRewardEntryStore {
  find(code: string): GlobalRewardEntry | undefined;
  save(item: GlobalRewardEntry): void;
  remove(code: string): boolean;
  list(): GlobalRewardEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalRewardEntryStore implements GlobalRewardEntryStore {
  items: Map<string, GlobalRewardEntry>;
  order: string[];

  constructor(items: Map<string, GlobalRewardEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalRewardEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalRewardEntry): void {
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

  list(): GlobalRewardEntry[] {
    const out: GlobalRewardEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalRewardEntryStore(): GlobalRewardEntryStore {
  return new MemoryGlobalRewardEntryStore(new Map<string, GlobalRewardEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalRewardEntryStore implements GlobalRewardEntryStore {
  inner: GlobalRewardEntryStore;
  cache: cache.TtlCache<GlobalRewardEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalRewardEntryStore,
    cacheValue: cache.TtlCache<GlobalRewardEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalRewardEntry | undefined {
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

  save(item: GlobalRewardEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalRewardEntry[] {
    return this.inner.list();
  }
}

export function newCachedGlobalRewardEntryStore(inner: GlobalRewardEntryStore, ttl: number, clockValue: clock.Clock): GlobalRewardEntryStore {
  return new CachedGlobalRewardEntryStore(inner, cache.newTtlCache<GlobalRewardEntry>(512, ttl, clockValue), 0, 0);
}

/** Selects global reward entries. Empty fields match all. */
export class GlobalRewardEntryQuery {
  locale: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minClicks: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalRewardEntry): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalRewardEntry[]): GlobalRewardEntry[] {
    const matched = collections.filter(items, (candidate: GlobalRewardEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalRewardEntries(store: GlobalRewardEntryStore, query: GlobalRewardEntryQuery): GlobalRewardEntry[] {
  return query.apply(store.list());
}
