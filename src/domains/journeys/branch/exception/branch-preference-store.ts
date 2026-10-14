import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchPreference } from "./branch-preference.js";

/** Keeps branch preferences by code. */
export interface BranchPreferenceStore {
  find(code: string): BranchPreference | undefined;
  save(item: BranchPreference): void;
  remove(code: string): boolean;
  list(): BranchPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchPreferenceStore implements BranchPreferenceStore {
  items: Map<string, BranchPreference>;
  order: string[];

  constructor(items: Map<string, BranchPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchPreference): void {
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

  list(): BranchPreference[] {
    const out: BranchPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchPreferenceStore(): BranchPreferenceStore {
  return new MemoryBranchPreferenceStore(new Map<string, BranchPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchPreferenceStore implements BranchPreferenceStore {
  inner: BranchPreferenceStore;
  cache: cache.TtlCache<BranchPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: BranchPreferenceStore,
    cacheValue: cache.TtlCache<BranchPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchPreference | undefined {
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

  save(item: BranchPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchPreference[] {
    return this.inner.list();
  }
}

export function newCachedBranchPreferenceStore(inner: BranchPreferenceStore, ttl: number, clockValue: clock.Clock): BranchPreferenceStore {
  return new CachedBranchPreferenceStore(inner, cache.newTtlCache<BranchPreference>(256, ttl, clockValue), 0, 0);
}

/** Selects branch preferences. Empty fields match all. */
export class BranchPreferenceQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchPreference): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchPreference[]): BranchPreference[] {
    const matched = collections.filter(items, (candidate: BranchPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchPreferences(store: BranchPreferenceStore, query: BranchPreferenceQuery): BranchPreference[] {
  return query.apply(store.list());
}
