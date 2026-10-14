import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPreferenceBaseline } from "./manual-preference-baseline.js";

/** Keeps manual preference baselines by code. */
export interface ManualPreferenceBaselineStore {
  find(code: string): ManualPreferenceBaseline | undefined;
  save(item: ManualPreferenceBaseline): void;
  remove(code: string): boolean;
  list(): ManualPreferenceBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPreferenceBaselineStore implements ManualPreferenceBaselineStore {
  items: Map<string, ManualPreferenceBaseline>;
  order: string[];

  constructor(items: Map<string, ManualPreferenceBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPreferenceBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPreferenceBaseline): void {
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

  list(): ManualPreferenceBaseline[] {
    const out: ManualPreferenceBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPreferenceBaselineStore(): ManualPreferenceBaselineStore {
  return new MemoryManualPreferenceBaselineStore(new Map<string, ManualPreferenceBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPreferenceBaselineStore implements ManualPreferenceBaselineStore {
  inner: ManualPreferenceBaselineStore;
  cache: cache.TtlCache<ManualPreferenceBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPreferenceBaselineStore,
    cacheValue: cache.TtlCache<ManualPreferenceBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPreferenceBaseline | undefined {
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

  save(item: ManualPreferenceBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPreferenceBaseline[] {
    return this.inner.list();
  }
}

export function newCachedManualPreferenceBaselineStore(inner: ManualPreferenceBaselineStore, ttl: number, clockValue: clock.Clock): ManualPreferenceBaselineStore {
  return new CachedManualPreferenceBaselineStore(
    inner,
    cache.newTtlCache<ManualPreferenceBaseline>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual preference baselines. Empty fields match all. */
export class ManualPreferenceBaselineQuery {
  title: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRatio: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPreferenceBaseline): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPreferenceBaseline[]): ManualPreferenceBaseline[] {
    const matched = collections.filter(items, (candidate: ManualPreferenceBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPreferenceBaselines(store: ManualPreferenceBaselineStore, query: ManualPreferenceBaselineQuery): ManualPreferenceBaseline[] {
  return query.apply(store.list());
}
