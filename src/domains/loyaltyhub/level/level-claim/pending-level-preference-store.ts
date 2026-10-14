import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingLevelPreference } from "./pending-level-preference.js";

/** Keeps pending level preferences by code. */
export interface PendingLevelPreferenceStore {
  find(code: string): PendingLevelPreference | undefined;
  save(item: PendingLevelPreference): void;
  remove(code: string): boolean;
  list(): PendingLevelPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingLevelPreferenceStore implements PendingLevelPreferenceStore {
  items: Map<string, PendingLevelPreference>;
  order: string[];

  constructor(items: Map<string, PendingLevelPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingLevelPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingLevelPreference): void {
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

  list(): PendingLevelPreference[] {
    const out: PendingLevelPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingLevelPreferenceStore(): PendingLevelPreferenceStore {
  return new MemoryPendingLevelPreferenceStore(new Map<string, PendingLevelPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingLevelPreferenceStore implements PendingLevelPreferenceStore {
  inner: PendingLevelPreferenceStore;
  cache: cache.TtlCache<PendingLevelPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingLevelPreferenceStore,
    cacheValue: cache.TtlCache<PendingLevelPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingLevelPreference | undefined {
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

  save(item: PendingLevelPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingLevelPreference[] {
    return this.inner.list();
  }
}

export function newCachedPendingLevelPreferenceStore(inner: PendingLevelPreferenceStore, ttl: number, clockValue: clock.Clock): PendingLevelPreferenceStore {
  return new CachedPendingLevelPreferenceStore(
    inner,
    cache.newTtlCache<PendingLevelPreference>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending level preferences. Empty fields match all. */
export class PendingLevelPreferenceQuery {
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

  matches(item: PendingLevelPreference): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingLevelPreference[]): PendingLevelPreference[] {
    const matched = collections.filter(items, (candidate: PendingLevelPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingLevelPreferences(store: PendingLevelPreferenceStore, query: PendingLevelPreferenceQuery): PendingLevelPreference[] {
  return query.apply(store.list());
}
