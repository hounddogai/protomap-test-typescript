import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeEntry } from "./badge-entry.js";

/** Keeps badge entries by code. */
export interface BadgeEntryStore {
  find(code: string): BadgeEntry | undefined;
  save(item: BadgeEntry): void;
  remove(code: string): boolean;
  list(): BadgeEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeEntryStore implements BadgeEntryStore {
  items: Map<string, BadgeEntry>;
  order: string[];

  constructor(items: Map<string, BadgeEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeEntry): void {
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

  list(): BadgeEntry[] {
    const out: BadgeEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeEntryStore(): BadgeEntryStore {
  return new MemoryBadgeEntryStore(new Map<string, BadgeEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeEntryStore implements BadgeEntryStore {
  inner: BadgeEntryStore;
  cache: cache.TtlCache<BadgeEntry>;
  hits: number;
  misses: number;

  constructor(inner: BadgeEntryStore, cacheValue: cache.TtlCache<BadgeEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeEntry | undefined {
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

  save(item: BadgeEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeEntry[] {
    return this.inner.list();
  }
}

export function newCachedBadgeEntryStore(inner: BadgeEntryStore, ttl: number, clockValue: clock.Clock): BadgeEntryStore {
  return new CachedBadgeEntryStore(inner, cache.newTtlCache<BadgeEntry>(64, ttl, clockValue), 0, 0);
}

/** Selects badge entries. Empty fields match all. */
export class BadgeEntryQuery {
  channel: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeEntry): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeEntry[]): BadgeEntry[] {
    const matched = collections.filter(items, (candidate: BadgeEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeEntries(store: BadgeEntryStore, query: BadgeEntryQuery): BadgeEntry[] {
  return query.apply(store.list());
}
