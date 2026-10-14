import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryBranchPreference } from "./primary-branch-preference.js";

/** Keeps primary branch preferences by code. */
export interface PrimaryBranchPreferenceStore {
  find(code: string): PrimaryBranchPreference | undefined;
  save(item: PrimaryBranchPreference): void;
  remove(code: string): boolean;
  list(): PrimaryBranchPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryBranchPreferenceStore implements PrimaryBranchPreferenceStore {
  items: Map<string, PrimaryBranchPreference>;
  order: string[];

  constructor(items: Map<string, PrimaryBranchPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryBranchPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryBranchPreference): void {
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

  list(): PrimaryBranchPreference[] {
    const out: PrimaryBranchPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryBranchPreferenceStore(): PrimaryBranchPreferenceStore {
  return new MemoryPrimaryBranchPreferenceStore(new Map<string, PrimaryBranchPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryBranchPreferenceStore implements PrimaryBranchPreferenceStore {
  inner: PrimaryBranchPreferenceStore;
  cache: cache.TtlCache<PrimaryBranchPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryBranchPreferenceStore,
    cacheValue: cache.TtlCache<PrimaryBranchPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryBranchPreference | undefined {
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

  save(item: PrimaryBranchPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryBranchPreference[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryBranchPreferenceStore(inner: PrimaryBranchPreferenceStore, ttl: number, clockValue: clock.Clock): PrimaryBranchPreferenceStore {
  return new CachedPrimaryBranchPreferenceStore(
    inner,
    cache.newTtlCache<PrimaryBranchPreference>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary branch preferences. Empty fields match all. */
export class PrimaryBranchPreferenceQuery {
  unit: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRetries: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryBranchPreference): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryBranchPreference[]): PrimaryBranchPreference[] {
    const matched = collections.filter(items, (candidate: PrimaryBranchPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryBranchPreferences(store: PrimaryBranchPreferenceStore, query: PrimaryBranchPreferenceQuery): PrimaryBranchPreference[] {
  return query.apply(store.list());
}
