import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedBranchPreference } from "./weighted-branch-preference.js";

/** Keeps weighted branch preferences by code. */
export interface WeightedBranchPreferenceStore {
  find(code: string): WeightedBranchPreference | undefined;
  save(item: WeightedBranchPreference): void;
  remove(code: string): boolean;
  list(): WeightedBranchPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedBranchPreferenceStore implements WeightedBranchPreferenceStore {
  items: Map<string, WeightedBranchPreference>;
  order: string[];

  constructor(items: Map<string, WeightedBranchPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedBranchPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedBranchPreference): void {
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

  list(): WeightedBranchPreference[] {
    const out: WeightedBranchPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedBranchPreferenceStore(): WeightedBranchPreferenceStore {
  return new MemoryWeightedBranchPreferenceStore(new Map<string, WeightedBranchPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedBranchPreferenceStore implements WeightedBranchPreferenceStore {
  inner: WeightedBranchPreferenceStore;
  cache: cache.TtlCache<WeightedBranchPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedBranchPreferenceStore,
    cacheValue: cache.TtlCache<WeightedBranchPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedBranchPreference | undefined {
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

  save(item: WeightedBranchPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedBranchPreference[] {
    return this.inner.list();
  }
}

export function newCachedWeightedBranchPreferenceStore(inner: WeightedBranchPreferenceStore, ttl: number, clockValue: clock.Clock): WeightedBranchPreferenceStore {
  return new CachedWeightedBranchPreferenceStore(
    inner,
    cache.newTtlCache<WeightedBranchPreference>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted branch preferences. Empty fields match all. */
export class WeightedBranchPreferenceQuery {
  channel: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRetries: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedBranchPreference): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedBranchPreference[]): WeightedBranchPreference[] {
    const matched = collections.filter(items, (candidate: WeightedBranchPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedBranchPreferences(store: WeightedBranchPreferenceStore, query: WeightedBranchPreferenceQuery): WeightedBranchPreference[] {
  return query.apply(store.list());
}
