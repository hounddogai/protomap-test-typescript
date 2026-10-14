import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionEntry } from "./redemption-entry.js";

/** Keeps redemption entries by code. */
export interface RedemptionEntryStore {
  find(code: string): RedemptionEntry | undefined;
  save(item: RedemptionEntry): void;
  remove(code: string): boolean;
  list(): RedemptionEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionEntryStore implements RedemptionEntryStore {
  items: Map<string, RedemptionEntry>;
  order: string[];

  constructor(items: Map<string, RedemptionEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionEntry): void {
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

  list(): RedemptionEntry[] {
    const out: RedemptionEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionEntryStore(): RedemptionEntryStore {
  return new MemoryRedemptionEntryStore(new Map<string, RedemptionEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionEntryStore implements RedemptionEntryStore {
  inner: RedemptionEntryStore;
  cache: cache.TtlCache<RedemptionEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionEntryStore,
    cacheValue: cache.TtlCache<RedemptionEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionEntry | undefined {
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

  save(item: RedemptionEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionEntry[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionEntryStore(inner: RedemptionEntryStore, ttl: number, clockValue: clock.Clock): RedemptionEntryStore {
  return new CachedRedemptionEntryStore(inner, cache.newTtlCache<RedemptionEntry>(1024, ttl, clockValue), 0, 0);
}

/** Selects redemption entries. Empty fields match all. */
export class RedemptionEntryQuery {
  locale: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRatio: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionEntry): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionEntry[]): RedemptionEntry[] {
    const matched = collections.filter(items, (candidate: RedemptionEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionEntries(store: RedemptionEntryStore, query: RedemptionEntryQuery): RedemptionEntry[] {
  return query.apply(store.list());
}
