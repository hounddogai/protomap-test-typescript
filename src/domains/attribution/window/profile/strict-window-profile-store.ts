import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictWindowProfile } from "./strict-window-profile.js";

/** Keeps strict window profiles by code. */
export interface StrictWindowProfileStore {
  find(code: string): StrictWindowProfile | undefined;
  save(item: StrictWindowProfile): void;
  remove(code: string): boolean;
  list(): StrictWindowProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictWindowProfileStore implements StrictWindowProfileStore {
  items: Map<string, StrictWindowProfile>;
  order: string[];

  constructor(items: Map<string, StrictWindowProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictWindowProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictWindowProfile): void {
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

  list(): StrictWindowProfile[] {
    const out: StrictWindowProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictWindowProfileStore(): StrictWindowProfileStore {
  return new MemoryStrictWindowProfileStore(new Map<string, StrictWindowProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictWindowProfileStore implements StrictWindowProfileStore {
  inner: StrictWindowProfileStore;
  cache: cache.TtlCache<StrictWindowProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictWindowProfileStore,
    cacheValue: cache.TtlCache<StrictWindowProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictWindowProfile | undefined {
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

  save(item: StrictWindowProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictWindowProfile[] {
    return this.inner.list();
  }
}

export function newCachedStrictWindowProfileStore(inner: StrictWindowProfileStore, ttl: number, clockValue: clock.Clock): StrictWindowProfileStore {
  return new CachedStrictWindowProfileStore(inner, cache.newTtlCache<StrictWindowProfile>(1024, ttl, clockValue), 0, 0);
}

/** Selects strict window profiles. Empty fields match all. */
export class StrictWindowProfileQuery {
  source: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.source = source;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictWindowProfile): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictWindowProfile[]): StrictWindowProfile[] {
    const matched = collections.filter(items, (candidate: StrictWindowProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictWindowProfiles(store: StrictWindowProfileStore, query: StrictWindowProfileQuery): StrictWindowProfile[] {
  return query.apply(store.list());
}
