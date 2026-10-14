import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedActivationBundle } from "./capped-activation-bundle.js";

/** Keeps capped activation bundles by code. */
export interface CappedActivationBundleStore {
  find(code: string): CappedActivationBundle | undefined;
  save(item: CappedActivationBundle): void;
  remove(code: string): boolean;
  list(): CappedActivationBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedActivationBundleStore implements CappedActivationBundleStore {
  items: Map<string, CappedActivationBundle>;
  order: string[];

  constructor(items: Map<string, CappedActivationBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedActivationBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedActivationBundle): void {
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

  list(): CappedActivationBundle[] {
    const out: CappedActivationBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedActivationBundleStore(): CappedActivationBundleStore {
  return new MemoryCappedActivationBundleStore(new Map<string, CappedActivationBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedActivationBundleStore implements CappedActivationBundleStore {
  inner: CappedActivationBundleStore;
  cache: cache.TtlCache<CappedActivationBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedActivationBundleStore,
    cacheValue: cache.TtlCache<CappedActivationBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedActivationBundle | undefined {
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

  save(item: CappedActivationBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedActivationBundle[] {
    return this.inner.list();
  }
}

export function newCachedCappedActivationBundleStore(inner: CappedActivationBundleStore, ttl: number, clockValue: clock.Clock): CappedActivationBundleStore {
  return new CachedCappedActivationBundleStore(
    inner,
    cache.newTtlCache<CappedActivationBundle>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped activation bundles. Empty fields match all. */
export class CappedActivationBundleQuery {
  utmSource: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minScore: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedActivationBundle): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedActivationBundle[]): CappedActivationBundle[] {
    const matched = collections.filter(items, (candidate: CappedActivationBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedActivationBundles(store: CappedActivationBundleStore, query: CappedActivationBundleQuery): CappedActivationBundle[] {
  return query.apply(store.list());
}
