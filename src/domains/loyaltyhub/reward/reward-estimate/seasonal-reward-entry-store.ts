import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalRewardEntry } from "./seasonal-reward-entry.js";

/** Keeps seasonal reward entries by code. */
export interface SeasonalRewardEntryStore {
  find(code: string): SeasonalRewardEntry | undefined;
  save(item: SeasonalRewardEntry): void;
  remove(code: string): boolean;
  list(): SeasonalRewardEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalRewardEntryStore implements SeasonalRewardEntryStore {
  items: Map<string, SeasonalRewardEntry>;
  order: string[];

  constructor(items: Map<string, SeasonalRewardEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalRewardEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalRewardEntry): void {
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

  list(): SeasonalRewardEntry[] {
    const out: SeasonalRewardEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalRewardEntryStore(): SeasonalRewardEntryStore {
  return new MemorySeasonalRewardEntryStore(new Map<string, SeasonalRewardEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalRewardEntryStore implements SeasonalRewardEntryStore {
  inner: SeasonalRewardEntryStore;
  cache: cache.TtlCache<SeasonalRewardEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalRewardEntryStore,
    cacheValue: cache.TtlCache<SeasonalRewardEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalRewardEntry | undefined {
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

  save(item: SeasonalRewardEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalRewardEntry[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalRewardEntryStore(inner: SeasonalRewardEntryStore, ttl: number, clockValue: clock.Clock): SeasonalRewardEntryStore {
  return new CachedSeasonalRewardEntryStore(inner, cache.newTtlCache<SeasonalRewardEntry>(256, ttl, clockValue), 0, 0);
}

/** Selects seasonal reward entries. Empty fields match all. */
export class SeasonalRewardEntryQuery {
  unit: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minQuantity: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalRewardEntry): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalRewardEntry[]): SeasonalRewardEntry[] {
    const matched = collections.filter(items, (candidate: SeasonalRewardEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalRewardEntries(store: SeasonalRewardEntryStore, query: SeasonalRewardEntryQuery): SeasonalRewardEntry[] {
  return query.apply(store.list());
}
