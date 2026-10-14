import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostBundle } from "./post-bundle.js";

/** Keeps post bundles by code. */
export interface PostBundleStore {
  find(code: string): PostBundle | undefined;
  save(item: PostBundle): void;
  remove(code: string): boolean;
  list(): PostBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostBundleStore implements PostBundleStore {
  items: Map<string, PostBundle>;
  order: string[];

  constructor(items: Map<string, PostBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostBundle): void {
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

  list(): PostBundle[] {
    const out: PostBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostBundleStore(): PostBundleStore {
  return new MemoryPostBundleStore(new Map<string, PostBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostBundleStore implements PostBundleStore {
  inner: PostBundleStore;
  cache: cache.TtlCache<PostBundle>;
  hits: number;
  misses: number;

  constructor(inner: PostBundleStore, cacheValue: cache.TtlCache<PostBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostBundle | undefined {
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

  save(item: PostBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostBundle[] {
    return this.inner.list();
  }
}

export function newCachedPostBundleStore(inner: PostBundleStore, ttl: number, clockValue: clock.Clock): PostBundleStore {
  return new CachedPostBundleStore(inner, cache.newTtlCache<PostBundle>(512, ttl, clockValue), 0, 0);
}

/** Selects post bundles. Empty fields match all. */
export class PostBundleQuery {
  country: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBid: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostBundle): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostBundle[]): PostBundle[] {
    const matched = collections.filter(items, (candidate: PostBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostBundles(store: PostBundleStore, query: PostBundleQuery): PostBundle[] {
  return query.apply(store.list());
}
