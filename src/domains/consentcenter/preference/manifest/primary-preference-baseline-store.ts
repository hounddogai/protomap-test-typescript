import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPreferenceBaseline } from "./primary-preference-baseline.js";

/** Keeps primary preference baselines by code. */
export interface PrimaryPreferenceBaselineStore {
  find(code: string): PrimaryPreferenceBaseline | undefined;
  save(item: PrimaryPreferenceBaseline): void;
  remove(code: string): boolean;
  list(): PrimaryPreferenceBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPreferenceBaselineStore implements PrimaryPreferenceBaselineStore {
  items: Map<string, PrimaryPreferenceBaseline>;
  order: string[];

  constructor(items: Map<string, PrimaryPreferenceBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPreferenceBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPreferenceBaseline): void {
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

  list(): PrimaryPreferenceBaseline[] {
    const out: PrimaryPreferenceBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPreferenceBaselineStore(): PrimaryPreferenceBaselineStore {
  return new MemoryPrimaryPreferenceBaselineStore(new Map<string, PrimaryPreferenceBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPreferenceBaselineStore implements PrimaryPreferenceBaselineStore {
  inner: PrimaryPreferenceBaselineStore;
  cache: cache.TtlCache<PrimaryPreferenceBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPreferenceBaselineStore,
    cacheValue: cache.TtlCache<PrimaryPreferenceBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPreferenceBaseline | undefined {
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

  save(item: PrimaryPreferenceBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPreferenceBaseline[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPreferenceBaselineStore(inner: PrimaryPreferenceBaselineStore, ttl: number, clockValue: clock.Clock): PrimaryPreferenceBaselineStore {
  return new CachedPrimaryPreferenceBaselineStore(
    inner,
    cache.newTtlCache<PrimaryPreferenceBaseline>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary preference baselines. Empty fields match all. */
export class PrimaryPreferenceBaselineQuery {
  locale: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSequence: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPreferenceBaseline): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPreferenceBaseline[]): PrimaryPreferenceBaseline[] {
    const matched = collections.filter(items, (candidate: PrimaryPreferenceBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPreferenceBaselines(store: PrimaryPreferenceBaselineStore, query: PrimaryPreferenceBaselineQuery): PrimaryPreferenceBaseline[] {
  return query.apply(store.list());
}
