import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostRequest } from "./post-request.js";

/** Keeps post requests by code. */
export interface PostRequestStore {
  find(code: string): PostRequest | undefined;
  save(item: PostRequest): void;
  remove(code: string): boolean;
  list(): PostRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostRequestStore implements PostRequestStore {
  items: Map<string, PostRequest>;
  order: string[];

  constructor(items: Map<string, PostRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostRequest): void {
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

  list(): PostRequest[] {
    const out: PostRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostRequestStore(): PostRequestStore {
  return new MemoryPostRequestStore(new Map<string, PostRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostRequestStore implements PostRequestStore {
  inner: PostRequestStore;
  cache: cache.TtlCache<PostRequest>;
  hits: number;
  misses: number;

  constructor(inner: PostRequestStore, cacheValue: cache.TtlCache<PostRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostRequest | undefined {
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

  save(item: PostRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostRequest[] {
    return this.inner.list();
  }
}

export function newCachedPostRequestStore(inner: PostRequestStore, ttl: number, clockValue: clock.Clock): PostRequestStore {
  return new CachedPostRequestStore(inner, cache.newTtlCache<PostRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects post requests. Empty fields match all. */
export class PostRequestQuery {
  country: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMaximum: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostRequest): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostRequest[]): PostRequest[] {
    const matched = collections.filter(items, (candidate: PostRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostRequests(store: PostRequestStore, query: PostRequestQuery): PostRequest[] {
  return query.apply(store.list());
}
