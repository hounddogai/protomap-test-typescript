import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeBundle } from "./creative-bundle.js";

/** Keeps creative bundles by code. */
export interface CreativeBundleStore {
  find(code: string): CreativeBundle | undefined;
  save(item: CreativeBundle): void;
  remove(code: string): boolean;
  list(): CreativeBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeBundleStore implements CreativeBundleStore {
  items: Map<string, CreativeBundle>;
  order: string[];

  constructor(items: Map<string, CreativeBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeBundle): void {
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

  list(): CreativeBundle[] {
    const out: CreativeBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeBundleStore(): CreativeBundleStore {
  return new MemoryCreativeBundleStore(new Map<string, CreativeBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeBundleStore implements CreativeBundleStore {
  inner: CreativeBundleStore;
  cache: cache.TtlCache<CreativeBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeBundleStore,
    cacheValue: cache.TtlCache<CreativeBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeBundle | undefined {
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

  save(item: CreativeBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeBundle[] {
    return this.inner.list();
  }
}

export function newCachedCreativeBundleStore(inner: CreativeBundleStore, ttl: number, clockValue: clock.Clock): CreativeBundleStore {
  return new CachedCreativeBundleStore(inner, cache.newTtlCache<CreativeBundle>(512, ttl, clockValue), 0, 0);
}

/** Selects creative bundles. Empty fields match all. */
export class CreativeBundleQuery {
  locale: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeBundle): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeBundle[]): CreativeBundle[] {
    const matched = collections.filter(items, (candidate: CreativeBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeBundles(store: CreativeBundleStore, query: CreativeBundleQuery): CreativeBundle[] {
  return query.apply(store.list());
}
