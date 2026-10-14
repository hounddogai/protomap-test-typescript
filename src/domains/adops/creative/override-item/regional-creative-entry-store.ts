import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalCreativeEntry } from "./regional-creative-entry.js";

/** Keeps regional creative entries by code. */
export interface RegionalCreativeEntryStore {
  find(code: string): RegionalCreativeEntry | undefined;
  save(item: RegionalCreativeEntry): void;
  remove(code: string): boolean;
  list(): RegionalCreativeEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalCreativeEntryStore implements RegionalCreativeEntryStore {
  items: Map<string, RegionalCreativeEntry>;
  order: string[];

  constructor(items: Map<string, RegionalCreativeEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalCreativeEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalCreativeEntry): void {
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

  list(): RegionalCreativeEntry[] {
    const out: RegionalCreativeEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalCreativeEntryStore(): RegionalCreativeEntryStore {
  return new MemoryRegionalCreativeEntryStore(new Map<string, RegionalCreativeEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalCreativeEntryStore implements RegionalCreativeEntryStore {
  inner: RegionalCreativeEntryStore;
  cache: cache.TtlCache<RegionalCreativeEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalCreativeEntryStore,
    cacheValue: cache.TtlCache<RegionalCreativeEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalCreativeEntry | undefined {
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

  save(item: RegionalCreativeEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalCreativeEntry[] {
    return this.inner.list();
  }
}

export function newCachedRegionalCreativeEntryStore(inner: RegionalCreativeEntryStore, ttl: number, clockValue: clock.Clock): RegionalCreativeEntryStore {
  return new CachedRegionalCreativeEntryStore(
    inner,
    cache.newTtlCache<RegionalCreativeEntry>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional creative entries. Empty fields match all. */
export class RegionalCreativeEntryQuery {
  region: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minScore: number, statuses: string[], limit: number) {
    this.region = region;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalCreativeEntry): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalCreativeEntry[]): RegionalCreativeEntry[] {
    const matched = collections.filter(items, (candidate: RegionalCreativeEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalCreativeEntries(store: RegionalCreativeEntryStore, query: RegionalCreativeEntryQuery): RegionalCreativeEntry[] {
  return query.apply(store.list());
}
