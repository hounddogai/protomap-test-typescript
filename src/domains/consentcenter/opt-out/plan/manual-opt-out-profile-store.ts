import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualOptOutProfile } from "./manual-opt-out-profile.js";

/** Keeps manual opt out profiles by code. */
export interface ManualOptOutProfileStore {
  find(code: string): ManualOptOutProfile | undefined;
  save(item: ManualOptOutProfile): void;
  remove(code: string): boolean;
  list(): ManualOptOutProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualOptOutProfileStore implements ManualOptOutProfileStore {
  items: Map<string, ManualOptOutProfile>;
  order: string[];

  constructor(items: Map<string, ManualOptOutProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualOptOutProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualOptOutProfile): void {
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

  list(): ManualOptOutProfile[] {
    const out: ManualOptOutProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualOptOutProfileStore(): ManualOptOutProfileStore {
  return new MemoryManualOptOutProfileStore(new Map<string, ManualOptOutProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualOptOutProfileStore implements ManualOptOutProfileStore {
  inner: ManualOptOutProfileStore;
  cache: cache.TtlCache<ManualOptOutProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualOptOutProfileStore,
    cacheValue: cache.TtlCache<ManualOptOutProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualOptOutProfile | undefined {
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

  save(item: ManualOptOutProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualOptOutProfile[] {
    return this.inner.list();
  }
}

export function newCachedManualOptOutProfileStore(inner: ManualOptOutProfileStore, ttl: number, clockValue: clock.Clock): ManualOptOutProfileStore {
  return new CachedManualOptOutProfileStore(inner, cache.newTtlCache<ManualOptOutProfile>(512, ttl, clockValue), 0, 0);
}

/** Selects manual opt out profiles. Empty fields match all. */
export class ManualOptOutProfileQuery {
  name: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minEndsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualOptOutProfile): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualOptOutProfile[]): ManualOptOutProfile[] {
    const matched = collections.filter(items, (candidate: ManualOptOutProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualOptOutProfiles(store: ManualOptOutProfileStore, query: ManualOptOutProfileQuery): ManualOptOutProfile[] {
  return query.apply(store.list());
}
