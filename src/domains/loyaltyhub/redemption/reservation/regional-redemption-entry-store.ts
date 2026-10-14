import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalRedemptionEntry } from "./regional-redemption-entry.js";

/** Keeps regional redemption entries by code. */
export interface RegionalRedemptionEntryStore {
  find(code: string): RegionalRedemptionEntry | undefined;
  save(item: RegionalRedemptionEntry): void;
  remove(code: string): boolean;
  list(): RegionalRedemptionEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalRedemptionEntryStore implements RegionalRedemptionEntryStore {
  items: Map<string, RegionalRedemptionEntry>;
  order: string[];

  constructor(items: Map<string, RegionalRedemptionEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalRedemptionEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalRedemptionEntry): void {
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

  list(): RegionalRedemptionEntry[] {
    const out: RegionalRedemptionEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalRedemptionEntryStore(): RegionalRedemptionEntryStore {
  return new MemoryRegionalRedemptionEntryStore(new Map<string, RegionalRedemptionEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalRedemptionEntryStore implements RegionalRedemptionEntryStore {
  inner: RegionalRedemptionEntryStore;
  cache: cache.TtlCache<RegionalRedemptionEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalRedemptionEntryStore,
    cacheValue: cache.TtlCache<RegionalRedemptionEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalRedemptionEntry | undefined {
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

  save(item: RegionalRedemptionEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalRedemptionEntry[] {
    return this.inner.list();
  }
}

export function newCachedRegionalRedemptionEntryStore(inner: RegionalRedemptionEntryStore, ttl: number, clockValue: clock.Clock): RegionalRedemptionEntryStore {
  return new CachedRegionalRedemptionEntryStore(
    inner,
    cache.newTtlCache<RegionalRedemptionEntry>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional redemption entries. Empty fields match all. */
export class RegionalRedemptionEntryQuery {
  channel: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBid: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalRedemptionEntry): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalRedemptionEntry[]): RegionalRedemptionEntry[] {
    const matched = collections.filter(items, (candidate: RegionalRedemptionEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalRedemptionEntries(store: RegionalRedemptionEntryStore, query: RegionalRedemptionEntryQuery): RegionalRedemptionEntry[] {
  return query.apply(store.list());
}
