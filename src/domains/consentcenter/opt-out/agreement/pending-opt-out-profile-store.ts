import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingOptOutProfile } from "./pending-opt-out-profile.js";

/** Keeps pending opt out profiles by code. */
export interface PendingOptOutProfileStore {
  find(code: string): PendingOptOutProfile | undefined;
  save(item: PendingOptOutProfile): void;
  remove(code: string): boolean;
  list(): PendingOptOutProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingOptOutProfileStore implements PendingOptOutProfileStore {
  items: Map<string, PendingOptOutProfile>;
  order: string[];

  constructor(items: Map<string, PendingOptOutProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingOptOutProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingOptOutProfile): void {
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

  list(): PendingOptOutProfile[] {
    const out: PendingOptOutProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingOptOutProfileStore(): PendingOptOutProfileStore {
  return new MemoryPendingOptOutProfileStore(new Map<string, PendingOptOutProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingOptOutProfileStore implements PendingOptOutProfileStore {
  inner: PendingOptOutProfileStore;
  cache: cache.TtlCache<PendingOptOutProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingOptOutProfileStore,
    cacheValue: cache.TtlCache<PendingOptOutProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingOptOutProfile | undefined {
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

  save(item: PendingOptOutProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingOptOutProfile[] {
    return this.inner.list();
  }
}

export function newCachedPendingOptOutProfileStore(inner: PendingOptOutProfileStore, ttl: number, clockValue: clock.Clock): PendingOptOutProfileStore {
  return new CachedPendingOptOutProfileStore(
    inner,
    cache.newTtlCache<PendingOptOutProfile>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending opt out profiles. Empty fields match all. */
export class PendingOptOutProfileQuery {
  utmSource: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minAttempts: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingOptOutProfile): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingOptOutProfile[]): PendingOptOutProfile[] {
    const matched = collections.filter(items, (candidate: PendingOptOutProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingOptOutProfiles(store: PendingOptOutProfileStore, query: PendingOptOutProfileQuery): PendingOptOutProfile[] {
  return query.apply(store.list());
}
