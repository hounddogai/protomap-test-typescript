import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationEntry } from "./reputation-entry.js";

/** Keeps reputation entries by code. */
export interface ReputationEntryStore {
  find(code: string): ReputationEntry | undefined;
  save(item: ReputationEntry): void;
  remove(code: string): boolean;
  list(): ReputationEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationEntryStore implements ReputationEntryStore {
  items: Map<string, ReputationEntry>;
  order: string[];

  constructor(items: Map<string, ReputationEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationEntry): void {
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

  list(): ReputationEntry[] {
    const out: ReputationEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationEntryStore(): ReputationEntryStore {
  return new MemoryReputationEntryStore(new Map<string, ReputationEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationEntryStore implements ReputationEntryStore {
  inner: ReputationEntryStore;
  cache: cache.TtlCache<ReputationEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationEntryStore,
    cacheValue: cache.TtlCache<ReputationEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationEntry | undefined {
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

  save(item: ReputationEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationEntry[] {
    return this.inner.list();
  }
}

export function newCachedReputationEntryStore(inner: ReputationEntryStore, ttl: number, clockValue: clock.Clock): ReputationEntryStore {
  return new CachedReputationEntryStore(inner, cache.newTtlCache<ReputationEntry>(128, ttl, clockValue), 0, 0);
}

/** Selects reputation entries. Empty fields match all. */
export class ReputationEntryQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationEntry): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationEntry[]): ReputationEntry[] {
    const matched = collections.filter(items, (candidate: ReputationEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationEntries(store: ReputationEntryStore, query: ReputationEntryQuery): ReputationEntry[] {
  return query.apply(store.list());
}
