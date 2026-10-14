import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionProfile } from "./suppression-profile.js";

/** Keeps suppression profiles by code. */
export interface SuppressionProfileStore {
  find(code: string): SuppressionProfile | undefined;
  save(item: SuppressionProfile): void;
  remove(code: string): boolean;
  list(): SuppressionProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionProfileStore implements SuppressionProfileStore {
  items: Map<string, SuppressionProfile>;
  order: string[];

  constructor(items: Map<string, SuppressionProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionProfile): void {
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

  list(): SuppressionProfile[] {
    const out: SuppressionProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionProfileStore(): SuppressionProfileStore {
  return new MemorySuppressionProfileStore(new Map<string, SuppressionProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionProfileStore implements SuppressionProfileStore {
  inner: SuppressionProfileStore;
  cache: cache.TtlCache<SuppressionProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionProfileStore,
    cacheValue: cache.TtlCache<SuppressionProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionProfile | undefined {
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

  save(item: SuppressionProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionProfile[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionProfileStore(inner: SuppressionProfileStore, ttl: number, clockValue: clock.Clock): SuppressionProfileStore {
  return new CachedSuppressionProfileStore(inner, cache.newTtlCache<SuppressionProfile>(1024, ttl, clockValue), 0, 0);
}

/** Selects suppression profiles. Empty fields match all. */
export class SuppressionProfileQuery {
  region: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRatio: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionProfile): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionProfile[]): SuppressionProfile[] {
    const matched = collections.filter(items, (candidate: SuppressionProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionProfiles(store: SuppressionProfileStore, query: SuppressionProfileQuery): SuppressionProfile[] {
  return query.apply(store.list());
}
