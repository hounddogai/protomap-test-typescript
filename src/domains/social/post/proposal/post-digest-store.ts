import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostDigest } from "./post-digest.js";

/** Keeps post digests by code. */
export interface PostDigestStore {
  find(code: string): PostDigest | undefined;
  save(item: PostDigest): void;
  remove(code: string): boolean;
  list(): PostDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostDigestStore implements PostDigestStore {
  items: Map<string, PostDigest>;
  order: string[];

  constructor(items: Map<string, PostDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostDigest): void {
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

  list(): PostDigest[] {
    const out: PostDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostDigestStore(): PostDigestStore {
  return new MemoryPostDigestStore(new Map<string, PostDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostDigestStore implements PostDigestStore {
  inner: PostDigestStore;
  cache: cache.TtlCache<PostDigest>;
  hits: number;
  misses: number;

  constructor(inner: PostDigestStore, cacheValue: cache.TtlCache<PostDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostDigest | undefined {
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

  save(item: PostDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostDigest[] {
    return this.inner.list();
  }
}

export function newCachedPostDigestStore(inner: PostDigestStore, ttl: number, clockValue: clock.Clock): PostDigestStore {
  return new CachedPostDigestStore(inner, cache.newTtlCache<PostDigest>(64, ttl, clockValue), 0, 0);
}

/** Selects post digests. Empty fields match all. */
export class PostDigestQuery {
  utmSource: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRetries: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostDigest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostDigest[]): PostDigest[] {
    const matched = collections.filter(items, (candidate: PostDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostDigests(store: PostDigestStore, query: PostDigestQuery): PostDigest[] {
  return query.apply(store.list());
}
