import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathOverride } from "./path-override.js";

/** Keeps path overrides by code. */
export interface PathOverrideStore {
  find(code: string): PathOverride | undefined;
  save(item: PathOverride): void;
  remove(code: string): boolean;
  list(): PathOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathOverrideStore implements PathOverrideStore {
  items: Map<string, PathOverride>;
  order: string[];

  constructor(items: Map<string, PathOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathOverride): void {
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

  list(): PathOverride[] {
    const out: PathOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathOverrideStore(): PathOverrideStore {
  return new MemoryPathOverrideStore(new Map<string, PathOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathOverrideStore implements PathOverrideStore {
  inner: PathOverrideStore;
  cache: cache.TtlCache<PathOverride>;
  hits: number;
  misses: number;

  constructor(inner: PathOverrideStore, cacheValue: cache.TtlCache<PathOverride>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathOverride | undefined {
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

  save(item: PathOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathOverride[] {
    return this.inner.list();
  }
}

export function newCachedPathOverrideStore(inner: PathOverrideStore, ttl: number, clockValue: clock.Clock): PathOverrideStore {
  return new CachedPathOverrideStore(inner, cache.newTtlCache<PathOverride>(1024, ttl, clockValue), 0, 0);
}

/** Selects path overrides. Empty fields match all. */
export class PathOverrideQuery {
  utmSource: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathOverride): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathOverride[]): PathOverride[] {
    const matched = collections.filter(items, (candidate: PathOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathOverrides(store: PathOverrideStore, query: PathOverrideQuery): PathOverride[] {
  return query.apply(store.list());
}
