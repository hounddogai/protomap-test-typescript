import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathDigest } from "./path-digest.js";

/** Keeps path digests by code. */
export interface PathDigestStore {
  find(code: string): PathDigest | undefined;
  save(item: PathDigest): void;
  remove(code: string): boolean;
  list(): PathDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathDigestStore implements PathDigestStore {
  items: Map<string, PathDigest>;
  order: string[];

  constructor(items: Map<string, PathDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathDigest): void {
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

  list(): PathDigest[] {
    const out: PathDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathDigestStore(): PathDigestStore {
  return new MemoryPathDigestStore(new Map<string, PathDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathDigestStore implements PathDigestStore {
  inner: PathDigestStore;
  cache: cache.TtlCache<PathDigest>;
  hits: number;
  misses: number;

  constructor(inner: PathDigestStore, cacheValue: cache.TtlCache<PathDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathDigest | undefined {
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

  save(item: PathDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathDigest[] {
    return this.inner.list();
  }
}

export function newCachedPathDigestStore(inner: PathDigestStore, ttl: number, clockValue: clock.Clock): PathDigestStore {
  return new CachedPathDigestStore(inner, cache.newTtlCache<PathDigest>(256, ttl, clockValue), 0, 0);
}

/** Selects path digests. Empty fields match all. */
export class PathDigestQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathDigest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathDigest[]): PathDigest[] {
    const matched = collections.filter(items, (candidate: PathDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathDigests(store: PathDigestStore, query: PathDigestQuery): PathDigest[] {
  return query.apply(store.list());
}
