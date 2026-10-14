import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalSlaDigest } from "./global-sla-digest.js";

/** Keeps global sla digests by code. */
export interface GlobalSlaDigestStore {
  find(code: string): GlobalSlaDigest | undefined;
  save(item: GlobalSlaDigest): void;
  remove(code: string): boolean;
  list(): GlobalSlaDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalSlaDigestStore implements GlobalSlaDigestStore {
  items: Map<string, GlobalSlaDigest>;
  order: string[];

  constructor(items: Map<string, GlobalSlaDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalSlaDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalSlaDigest): void {
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

  list(): GlobalSlaDigest[] {
    const out: GlobalSlaDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalSlaDigestStore(): GlobalSlaDigestStore {
  return new MemoryGlobalSlaDigestStore(new Map<string, GlobalSlaDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalSlaDigestStore implements GlobalSlaDigestStore {
  inner: GlobalSlaDigestStore;
  cache: cache.TtlCache<GlobalSlaDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalSlaDigestStore,
    cacheValue: cache.TtlCache<GlobalSlaDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalSlaDigest | undefined {
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

  save(item: GlobalSlaDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalSlaDigest[] {
    return this.inner.list();
  }
}

export function newCachedGlobalSlaDigestStore(inner: GlobalSlaDigestStore, ttl: number, clockValue: clock.Clock): GlobalSlaDigestStore {
  return new CachedGlobalSlaDigestStore(inner, cache.newTtlCache<GlobalSlaDigest>(256, ttl, clockValue), 0, 0);
}

/** Selects global sla digests. Empty fields match all. */
export class GlobalSlaDigestQuery {
  category: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minPriority: number, statuses: string[], limit: number) {
    this.category = category;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalSlaDigest): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalSlaDigest[]): GlobalSlaDigest[] {
    const matched = collections.filter(items, (candidate: GlobalSlaDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalSlaDigests(store: GlobalSlaDigestStore, query: GlobalSlaDigestQuery): GlobalSlaDigest[] {
  return query.apply(store.list());
}
