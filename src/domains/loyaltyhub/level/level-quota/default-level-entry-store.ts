import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultLevelEntry } from "./default-level-entry.js";

/** Keeps default level entries by code. */
export interface DefaultLevelEntryStore {
  find(code: string): DefaultLevelEntry | undefined;
  save(item: DefaultLevelEntry): void;
  remove(code: string): boolean;
  list(): DefaultLevelEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultLevelEntryStore implements DefaultLevelEntryStore {
  items: Map<string, DefaultLevelEntry>;
  order: string[];

  constructor(items: Map<string, DefaultLevelEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultLevelEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultLevelEntry): void {
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

  list(): DefaultLevelEntry[] {
    const out: DefaultLevelEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultLevelEntryStore(): DefaultLevelEntryStore {
  return new MemoryDefaultLevelEntryStore(new Map<string, DefaultLevelEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultLevelEntryStore implements DefaultLevelEntryStore {
  inner: DefaultLevelEntryStore;
  cache: cache.TtlCache<DefaultLevelEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultLevelEntryStore,
    cacheValue: cache.TtlCache<DefaultLevelEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultLevelEntry | undefined {
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

  save(item: DefaultLevelEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultLevelEntry[] {
    return this.inner.list();
  }
}

export function newCachedDefaultLevelEntryStore(inner: DefaultLevelEntryStore, ttl: number, clockValue: clock.Clock): DefaultLevelEntryStore {
  return new CachedDefaultLevelEntryStore(inner, cache.newTtlCache<DefaultLevelEntry>(256, ttl, clockValue), 0, 0);
}

/** Selects default level entries. Empty fields match all. */
export class DefaultLevelEntryQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultLevelEntry): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultLevelEntry[]): DefaultLevelEntry[] {
    const matched = collections.filter(items, (candidate: DefaultLevelEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultLevelEntries(store: DefaultLevelEntryStore, query: DefaultLevelEntryQuery): DefaultLevelEntry[] {
  return query.apply(store.list());
}
