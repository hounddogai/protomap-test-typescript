import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientActivationBundle } from "./lenient-activation-bundle.js";

/** Keeps lenient activation bundles by code. */
export interface LenientActivationBundleStore {
  find(code: string): LenientActivationBundle | undefined;
  save(item: LenientActivationBundle): void;
  remove(code: string): boolean;
  list(): LenientActivationBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientActivationBundleStore implements LenientActivationBundleStore {
  items: Map<string, LenientActivationBundle>;
  order: string[];

  constructor(items: Map<string, LenientActivationBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientActivationBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientActivationBundle): void {
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

  list(): LenientActivationBundle[] {
    const out: LenientActivationBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientActivationBundleStore(): LenientActivationBundleStore {
  return new MemoryLenientActivationBundleStore(new Map<string, LenientActivationBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientActivationBundleStore implements LenientActivationBundleStore {
  inner: LenientActivationBundleStore;
  cache: cache.TtlCache<LenientActivationBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientActivationBundleStore,
    cacheValue: cache.TtlCache<LenientActivationBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientActivationBundle | undefined {
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

  save(item: LenientActivationBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientActivationBundle[] {
    return this.inner.list();
  }
}

export function newCachedLenientActivationBundleStore(inner: LenientActivationBundleStore, ttl: number, clockValue: clock.Clock): LenientActivationBundleStore {
  return new CachedLenientActivationBundleStore(
    inner,
    cache.newTtlCache<LenientActivationBundle>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient activation bundles. Empty fields match all. */
export class LenientActivationBundleQuery {
  unit: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minImpressions: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientActivationBundle): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientActivationBundle[]): LenientActivationBundle[] {
    const matched = collections.filter(items, (candidate: LenientActivationBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientActivationBundles(store: LenientActivationBundleStore, query: LenientActivationBundleQuery): LenientActivationBundle[] {
  return query.apply(store.list());
}
