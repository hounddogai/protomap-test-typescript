import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPacingBundle } from "./strict-pacing-bundle.js";

/** Keeps strict pacing bundles by code. */
export interface StrictPacingBundleStore {
  find(code: string): StrictPacingBundle | undefined;
  save(item: StrictPacingBundle): void;
  remove(code: string): boolean;
  list(): StrictPacingBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPacingBundleStore implements StrictPacingBundleStore {
  items: Map<string, StrictPacingBundle>;
  order: string[];

  constructor(items: Map<string, StrictPacingBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPacingBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPacingBundle): void {
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

  list(): StrictPacingBundle[] {
    const out: StrictPacingBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPacingBundleStore(): StrictPacingBundleStore {
  return new MemoryStrictPacingBundleStore(new Map<string, StrictPacingBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPacingBundleStore implements StrictPacingBundleStore {
  inner: StrictPacingBundleStore;
  cache: cache.TtlCache<StrictPacingBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPacingBundleStore,
    cacheValue: cache.TtlCache<StrictPacingBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPacingBundle | undefined {
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

  save(item: StrictPacingBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPacingBundle[] {
    return this.inner.list();
  }
}

export function newCachedStrictPacingBundleStore(inner: StrictPacingBundleStore, ttl: number, clockValue: clock.Clock): StrictPacingBundleStore {
  return new CachedStrictPacingBundleStore(inner, cache.newTtlCache<StrictPacingBundle>(512, ttl, clockValue), 0, 0);
}

/** Selects strict pacing bundles. Empty fields match all. */
export class StrictPacingBundleQuery {
  region: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minSendAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictPacingBundle): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPacingBundle[]): StrictPacingBundle[] {
    const matched = collections.filter(items, (candidate: StrictPacingBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPacingBundles(store: StrictPacingBundleStore, query: StrictPacingBundleQuery): StrictPacingBundle[] {
  return query.apply(store.list());
}
