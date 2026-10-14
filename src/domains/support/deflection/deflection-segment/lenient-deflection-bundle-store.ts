import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientDeflectionBundle } from "./lenient-deflection-bundle.js";

/** Keeps lenient deflection bundles by code. */
export interface LenientDeflectionBundleStore {
  find(code: string): LenientDeflectionBundle | undefined;
  save(item: LenientDeflectionBundle): void;
  remove(code: string): boolean;
  list(): LenientDeflectionBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientDeflectionBundleStore implements LenientDeflectionBundleStore {
  items: Map<string, LenientDeflectionBundle>;
  order: string[];

  constructor(items: Map<string, LenientDeflectionBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientDeflectionBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientDeflectionBundle): void {
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

  list(): LenientDeflectionBundle[] {
    const out: LenientDeflectionBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientDeflectionBundleStore(): LenientDeflectionBundleStore {
  return new MemoryLenientDeflectionBundleStore(new Map<string, LenientDeflectionBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientDeflectionBundleStore implements LenientDeflectionBundleStore {
  inner: LenientDeflectionBundleStore;
  cache: cache.TtlCache<LenientDeflectionBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientDeflectionBundleStore,
    cacheValue: cache.TtlCache<LenientDeflectionBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientDeflectionBundle | undefined {
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

  save(item: LenientDeflectionBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientDeflectionBundle[] {
    return this.inner.list();
  }
}

export function newCachedLenientDeflectionBundleStore(inner: LenientDeflectionBundleStore, ttl: number, clockValue: clock.Clock): LenientDeflectionBundleStore {
  return new CachedLenientDeflectionBundleStore(
    inner,
    cache.newTtlCache<LenientDeflectionBundle>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient deflection bundles. Empty fields match all. */
export class LenientDeflectionBundleQuery {
  unit: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minVersion: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientDeflectionBundle): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientDeflectionBundle[]): LenientDeflectionBundle[] {
    const matched = collections.filter(items, (candidate: LenientDeflectionBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientDeflectionBundles(store: LenientDeflectionBundleStore, query: LenientDeflectionBundleQuery): LenientDeflectionBundle[] {
  return query.apply(store.list());
}
