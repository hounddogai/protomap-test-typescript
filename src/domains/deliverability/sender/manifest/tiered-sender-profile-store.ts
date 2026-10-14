import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredSenderProfile } from "./tiered-sender-profile.js";

/** Keeps tiered sender profiles by code. */
export interface TieredSenderProfileStore {
  find(code: string): TieredSenderProfile | undefined;
  save(item: TieredSenderProfile): void;
  remove(code: string): boolean;
  list(): TieredSenderProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredSenderProfileStore implements TieredSenderProfileStore {
  items: Map<string, TieredSenderProfile>;
  order: string[];

  constructor(items: Map<string, TieredSenderProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredSenderProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredSenderProfile): void {
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

  list(): TieredSenderProfile[] {
    const out: TieredSenderProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredSenderProfileStore(): TieredSenderProfileStore {
  return new MemoryTieredSenderProfileStore(new Map<string, TieredSenderProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredSenderProfileStore implements TieredSenderProfileStore {
  inner: TieredSenderProfileStore;
  cache: cache.TtlCache<TieredSenderProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredSenderProfileStore,
    cacheValue: cache.TtlCache<TieredSenderProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredSenderProfile | undefined {
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

  save(item: TieredSenderProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredSenderProfile[] {
    return this.inner.list();
  }
}

export function newCachedTieredSenderProfileStore(inner: TieredSenderProfileStore, ttl: number, clockValue: clock.Clock): TieredSenderProfileStore {
  return new CachedTieredSenderProfileStore(inner, cache.newTtlCache<TieredSenderProfile>(128, ttl, clockValue), 0, 0);
}

/** Selects tiered sender profiles. Empty fields match all. */
export class TieredSenderProfileQuery {
  name: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAttempts: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredSenderProfile): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredSenderProfile[]): TieredSenderProfile[] {
    const matched = collections.filter(items, (candidate: TieredSenderProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredSenderProfiles(store: TieredSenderProfileStore, query: TieredSenderProfileQuery): TieredSenderProfile[] {
  return query.apply(store.list());
}
