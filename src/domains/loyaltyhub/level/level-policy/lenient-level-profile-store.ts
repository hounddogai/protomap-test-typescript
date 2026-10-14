import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientLevelProfile } from "./lenient-level-profile.js";

/** Keeps lenient level profiles by code. */
export interface LenientLevelProfileStore {
  find(code: string): LenientLevelProfile | undefined;
  save(item: LenientLevelProfile): void;
  remove(code: string): boolean;
  list(): LenientLevelProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientLevelProfileStore implements LenientLevelProfileStore {
  items: Map<string, LenientLevelProfile>;
  order: string[];

  constructor(items: Map<string, LenientLevelProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientLevelProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientLevelProfile): void {
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

  list(): LenientLevelProfile[] {
    const out: LenientLevelProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientLevelProfileStore(): LenientLevelProfileStore {
  return new MemoryLenientLevelProfileStore(new Map<string, LenientLevelProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientLevelProfileStore implements LenientLevelProfileStore {
  inner: LenientLevelProfileStore;
  cache: cache.TtlCache<LenientLevelProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientLevelProfileStore,
    cacheValue: cache.TtlCache<LenientLevelProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientLevelProfile | undefined {
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

  save(item: LenientLevelProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientLevelProfile[] {
    return this.inner.list();
  }
}

export function newCachedLenientLevelProfileStore(inner: LenientLevelProfileStore, ttl: number, clockValue: clock.Clock): LenientLevelProfileStore {
  return new CachedLenientLevelProfileStore(inner, cache.newTtlCache<LenientLevelProfile>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient level profiles. Empty fields match all. */
export class LenientLevelProfileQuery {
  segment: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minQuantity: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientLevelProfile): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientLevelProfile[]): LenientLevelProfile[] {
    const matched = collections.filter(items, (candidate: LenientLevelProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientLevelProfiles(store: LenientLevelProfileStore, query: LenientLevelProfileQuery): LenientLevelProfile[] {
  return query.apply(store.list());
}
