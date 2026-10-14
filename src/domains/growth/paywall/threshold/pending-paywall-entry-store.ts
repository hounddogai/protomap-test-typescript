import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPaywallEntry } from "./pending-paywall-entry.js";

/** Keeps pending paywall entries by code. */
export interface PendingPaywallEntryStore {
  find(code: string): PendingPaywallEntry | undefined;
  save(item: PendingPaywallEntry): void;
  remove(code: string): boolean;
  list(): PendingPaywallEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPaywallEntryStore implements PendingPaywallEntryStore {
  items: Map<string, PendingPaywallEntry>;
  order: string[];

  constructor(items: Map<string, PendingPaywallEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPaywallEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPaywallEntry): void {
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

  list(): PendingPaywallEntry[] {
    const out: PendingPaywallEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPaywallEntryStore(): PendingPaywallEntryStore {
  return new MemoryPendingPaywallEntryStore(new Map<string, PendingPaywallEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPaywallEntryStore implements PendingPaywallEntryStore {
  inner: PendingPaywallEntryStore;
  cache: cache.TtlCache<PendingPaywallEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPaywallEntryStore,
    cacheValue: cache.TtlCache<PendingPaywallEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPaywallEntry | undefined {
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

  save(item: PendingPaywallEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPaywallEntry[] {
    return this.inner.list();
  }
}

export function newCachedPendingPaywallEntryStore(inner: PendingPaywallEntryStore, ttl: number, clockValue: clock.Clock): PendingPaywallEntryStore {
  return new CachedPendingPaywallEntryStore(inner, cache.newTtlCache<PendingPaywallEntry>(256, ttl, clockValue), 0, 0);
}

/** Selects pending paywall entries. Empty fields match all. */
export class PendingPaywallEntryQuery {
  segment: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPaywallEntry): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPaywallEntry[]): PendingPaywallEntry[] {
    const matched = collections.filter(items, (candidate: PendingPaywallEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPaywallEntries(store: PendingPaywallEntryStore, query: PendingPaywallEntryQuery): PendingPaywallEntry[] {
  return query.apply(store.list());
}
