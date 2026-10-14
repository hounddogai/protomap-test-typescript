import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationPreference } from "./reputation-preference.js";

/** Keeps reputation preferences by code. */
export interface ReputationPreferenceStore {
  find(code: string): ReputationPreference | undefined;
  save(item: ReputationPreference): void;
  remove(code: string): boolean;
  list(): ReputationPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationPreferenceStore implements ReputationPreferenceStore {
  items: Map<string, ReputationPreference>;
  order: string[];

  constructor(items: Map<string, ReputationPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationPreference): void {
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

  list(): ReputationPreference[] {
    const out: ReputationPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationPreferenceStore(): ReputationPreferenceStore {
  return new MemoryReputationPreferenceStore(new Map<string, ReputationPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationPreferenceStore implements ReputationPreferenceStore {
  inner: ReputationPreferenceStore;
  cache: cache.TtlCache<ReputationPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationPreferenceStore,
    cacheValue: cache.TtlCache<ReputationPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationPreference | undefined {
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

  save(item: ReputationPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationPreference[] {
    return this.inner.list();
  }
}

export function newCachedReputationPreferenceStore(inner: ReputationPreferenceStore, ttl: number, clockValue: clock.Clock): ReputationPreferenceStore {
  return new CachedReputationPreferenceStore(
    inner,
    cache.newTtlCache<ReputationPreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects reputation preferences. Empty fields match all. */
export class ReputationPreferenceQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationPreference): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationPreference[]): ReputationPreference[] {
    const matched = collections.filter(items, (candidate: ReputationPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationPreferences(store: ReputationPreferenceStore, query: ReputationPreferenceQuery): ReputationPreference[] {
  return query.apply(store.list());
}
