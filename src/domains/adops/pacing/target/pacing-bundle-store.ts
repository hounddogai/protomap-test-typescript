import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingBundle } from "./pacing-bundle.js";

/** Keeps pacing bundles by code. */
export interface PacingBundleStore {
  find(code: string): PacingBundle | undefined;
  save(item: PacingBundle): void;
  remove(code: string): boolean;
  list(): PacingBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingBundleStore implements PacingBundleStore {
  items: Map<string, PacingBundle>;
  order: string[];

  constructor(items: Map<string, PacingBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingBundle): void {
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

  list(): PacingBundle[] {
    const out: PacingBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingBundleStore(): PacingBundleStore {
  return new MemoryPacingBundleStore(new Map<string, PacingBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingBundleStore implements PacingBundleStore {
  inner: PacingBundleStore;
  cache: cache.TtlCache<PacingBundle>;
  hits: number;
  misses: number;

  constructor(inner: PacingBundleStore, cacheValue: cache.TtlCache<PacingBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingBundle | undefined {
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

  save(item: PacingBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingBundle[] {
    return this.inner.list();
  }
}

export function newCachedPacingBundleStore(inner: PacingBundleStore, ttl: number, clockValue: clock.Clock): PacingBundleStore {
  return new CachedPacingBundleStore(inner, cache.newTtlCache<PacingBundle>(64, ttl, clockValue), 0, 0);
}

/** Selects pacing bundles. Empty fields match all. */
export class PacingBundleQuery {
  label: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingBundle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingBundle[]): PacingBundle[] {
    const matched = collections.filter(items, (candidate: PacingBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingBundles(store: PacingBundleStore, query: PacingBundleQuery): PacingBundle[] {
  return query.apply(store.list());
}
