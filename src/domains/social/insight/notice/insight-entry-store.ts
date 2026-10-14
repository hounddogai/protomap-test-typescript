import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightEntry } from "./insight-entry.js";

/** Keeps insight entries by code. */
export interface InsightEntryStore {
  find(code: string): InsightEntry | undefined;
  save(item: InsightEntry): void;
  remove(code: string): boolean;
  list(): InsightEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightEntryStore implements InsightEntryStore {
  items: Map<string, InsightEntry>;
  order: string[];

  constructor(items: Map<string, InsightEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightEntry): void {
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

  list(): InsightEntry[] {
    const out: InsightEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightEntryStore(): InsightEntryStore {
  return new MemoryInsightEntryStore(new Map<string, InsightEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightEntryStore implements InsightEntryStore {
  inner: InsightEntryStore;
  cache: cache.TtlCache<InsightEntry>;
  hits: number;
  misses: number;

  constructor(inner: InsightEntryStore, cacheValue: cache.TtlCache<InsightEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightEntry | undefined {
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

  save(item: InsightEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightEntry[] {
    return this.inner.list();
  }
}

export function newCachedInsightEntryStore(inner: InsightEntryStore, ttl: number, clockValue: clock.Clock): InsightEntryStore {
  return new CachedInsightEntryStore(inner, cache.newTtlCache<InsightEntry>(128, ttl, clockValue), 0, 0);
}

/** Selects insight entries. Empty fields match all. */
export class InsightEntryQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightEntry): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightEntry[]): InsightEntry[] {
    const matched = collections.filter(items, (candidate: InsightEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightEntries(store: InsightEntryStore, query: InsightEntryQuery): InsightEntry[] {
  return query.apply(store.list());
}
