import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionPreference } from "./redemption-preference.js";

/** Keeps redemption preferences by code. */
export interface RedemptionPreferenceStore {
  find(code: string): RedemptionPreference | undefined;
  save(item: RedemptionPreference): void;
  remove(code: string): boolean;
  list(): RedemptionPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionPreferenceStore implements RedemptionPreferenceStore {
  items: Map<string, RedemptionPreference>;
  order: string[];

  constructor(items: Map<string, RedemptionPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionPreference): void {
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

  list(): RedemptionPreference[] {
    const out: RedemptionPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionPreferenceStore(): RedemptionPreferenceStore {
  return new MemoryRedemptionPreferenceStore(new Map<string, RedemptionPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionPreferenceStore implements RedemptionPreferenceStore {
  inner: RedemptionPreferenceStore;
  cache: cache.TtlCache<RedemptionPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionPreferenceStore,
    cacheValue: cache.TtlCache<RedemptionPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionPreference | undefined {
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

  save(item: RedemptionPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionPreference[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionPreferenceStore(inner: RedemptionPreferenceStore, ttl: number, clockValue: clock.Clock): RedemptionPreferenceStore {
  return new CachedRedemptionPreferenceStore(
    inner,
    cache.newTtlCache<RedemptionPreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects redemption preferences. Empty fields match all. */
export class RedemptionPreferenceQuery {
  unit: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRatio: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionPreference): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionPreference[]): RedemptionPreference[] {
    const matched = collections.filter(items, (candidate: RedemptionPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionPreferences(store: RedemptionPreferenceStore, query: RedemptionPreferenceQuery): RedemptionPreference[] {
  return query.apply(store.list());
}
