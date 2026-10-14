import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientDoubleOptInBundle } from "./lenient-double-opt-in-bundle.js";

/** Keeps lenient double opt in bundles by code. */
export interface LenientDoubleOptInBundleStore {
  find(code: string): LenientDoubleOptInBundle | undefined;
  save(item: LenientDoubleOptInBundle): void;
  remove(code: string): boolean;
  list(): LenientDoubleOptInBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientDoubleOptInBundleStore implements LenientDoubleOptInBundleStore {
  items: Map<string, LenientDoubleOptInBundle>;
  order: string[];

  constructor(items: Map<string, LenientDoubleOptInBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientDoubleOptInBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientDoubleOptInBundle): void {
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

  list(): LenientDoubleOptInBundle[] {
    const out: LenientDoubleOptInBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientDoubleOptInBundleStore(): LenientDoubleOptInBundleStore {
  return new MemoryLenientDoubleOptInBundleStore(new Map<string, LenientDoubleOptInBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientDoubleOptInBundleStore implements LenientDoubleOptInBundleStore {
  inner: LenientDoubleOptInBundleStore;
  cache: cache.TtlCache<LenientDoubleOptInBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientDoubleOptInBundleStore,
    cacheValue: cache.TtlCache<LenientDoubleOptInBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientDoubleOptInBundle | undefined {
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

  save(item: LenientDoubleOptInBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientDoubleOptInBundle[] {
    return this.inner.list();
  }
}

export function newCachedLenientDoubleOptInBundleStore(inner: LenientDoubleOptInBundleStore, ttl: number, clockValue: clock.Clock): LenientDoubleOptInBundleStore {
  return new CachedLenientDoubleOptInBundleStore(
    inner,
    cache.newTtlCache<LenientDoubleOptInBundle>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient double opt in bundles. Empty fields match all. */
export class LenientDoubleOptInBundleQuery {
  label: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minImpressions: number, statuses: string[], limit: number) {
    this.label = label;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientDoubleOptInBundle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientDoubleOptInBundle[]): LenientDoubleOptInBundle[] {
    const matched = collections.filter(items, (candidate: LenientDoubleOptInBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientDoubleOptInBundles(store: LenientDoubleOptInBundleStore, query: LenientDoubleOptInBundleQuery): LenientDoubleOptInBundle[] {
  return query.apply(store.list());
}
