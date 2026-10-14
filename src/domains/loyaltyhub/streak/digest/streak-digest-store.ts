import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakDigest } from "./streak-digest.js";

/** Keeps streak digests by code. */
export interface StreakDigestStore {
  find(code: string): StreakDigest | undefined;
  save(item: StreakDigest): void;
  remove(code: string): boolean;
  list(): StreakDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakDigestStore implements StreakDigestStore {
  items: Map<string, StreakDigest>;
  order: string[];

  constructor(items: Map<string, StreakDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakDigest): void {
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

  list(): StreakDigest[] {
    const out: StreakDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakDigestStore(): StreakDigestStore {
  return new MemoryStreakDigestStore(new Map<string, StreakDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakDigestStore implements StreakDigestStore {
  inner: StreakDigestStore;
  cache: cache.TtlCache<StreakDigest>;
  hits: number;
  misses: number;

  constructor(inner: StreakDigestStore, cacheValue: cache.TtlCache<StreakDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakDigest | undefined {
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

  save(item: StreakDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakDigest[] {
    return this.inner.list();
  }
}

export function newCachedStreakDigestStore(inner: StreakDigestStore, ttl: number, clockValue: clock.Clock): StreakDigestStore {
  return new CachedStreakDigestStore(inner, cache.newTtlCache<StreakDigest>(256, ttl, clockValue), 0, 0);
}

/** Selects streak digests. Empty fields match all. */
export class StreakDigestQuery {
  source: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWeight: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakDigest): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakDigest[]): StreakDigest[] {
    const matched = collections.filter(items, (candidate: StreakDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakDigests(store: StreakDigestStore, query: StreakDigestQuery): StreakDigest[] {
  return query.apply(store.list());
}
