import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalEnrollmentOverride } from "./seasonal-enrollment-override.js";

/** Keeps seasonal enrollment overrides by code. */
export interface SeasonalEnrollmentOverrideStore {
  find(code: string): SeasonalEnrollmentOverride | undefined;
  save(item: SeasonalEnrollmentOverride): void;
  remove(code: string): boolean;
  list(): SeasonalEnrollmentOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalEnrollmentOverrideStore implements SeasonalEnrollmentOverrideStore {
  items: Map<string, SeasonalEnrollmentOverride>;
  order: string[];

  constructor(items: Map<string, SeasonalEnrollmentOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalEnrollmentOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalEnrollmentOverride): void {
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

  list(): SeasonalEnrollmentOverride[] {
    const out: SeasonalEnrollmentOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalEnrollmentOverrideStore(): SeasonalEnrollmentOverrideStore {
  return new MemorySeasonalEnrollmentOverrideStore(new Map<string, SeasonalEnrollmentOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalEnrollmentOverrideStore implements SeasonalEnrollmentOverrideStore {
  inner: SeasonalEnrollmentOverrideStore;
  cache: cache.TtlCache<SeasonalEnrollmentOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalEnrollmentOverrideStore,
    cacheValue: cache.TtlCache<SeasonalEnrollmentOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalEnrollmentOverride | undefined {
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

  save(item: SeasonalEnrollmentOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalEnrollmentOverride[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalEnrollmentOverrideStore(inner: SeasonalEnrollmentOverrideStore, ttl: number, clockValue: clock.Clock): SeasonalEnrollmentOverrideStore {
  return new CachedSeasonalEnrollmentOverrideStore(
    inner,
    cache.newTtlCache<SeasonalEnrollmentOverride>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal enrollment overrides. Empty fields match all. */
export class SeasonalEnrollmentOverrideQuery {
  label: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMinimum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalEnrollmentOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalEnrollmentOverride[]): SeasonalEnrollmentOverride[] {
    const matched = collections.filter(items, (candidate: SeasonalEnrollmentOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalEnrollmentOverrides(store: SeasonalEnrollmentOverrideStore, query: SeasonalEnrollmentOverrideQuery): SeasonalEnrollmentOverride[] {
  return query.apply(store.list());
}
