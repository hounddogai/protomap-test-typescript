import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyDigest } from "./reply-digest.js";

/** Keeps reply digests by code. */
export interface ReplyDigestStore {
  find(code: string): ReplyDigest | undefined;
  save(item: ReplyDigest): void;
  remove(code: string): boolean;
  list(): ReplyDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyDigestStore implements ReplyDigestStore {
  items: Map<string, ReplyDigest>;
  order: string[];

  constructor(items: Map<string, ReplyDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyDigest): void {
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

  list(): ReplyDigest[] {
    const out: ReplyDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyDigestStore(): ReplyDigestStore {
  return new MemoryReplyDigestStore(new Map<string, ReplyDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyDigestStore implements ReplyDigestStore {
  inner: ReplyDigestStore;
  cache: cache.TtlCache<ReplyDigest>;
  hits: number;
  misses: number;

  constructor(inner: ReplyDigestStore, cacheValue: cache.TtlCache<ReplyDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyDigest | undefined {
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

  save(item: ReplyDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyDigest[] {
    return this.inner.list();
  }
}

export function newCachedReplyDigestStore(inner: ReplyDigestStore, ttl: number, clockValue: clock.Clock): ReplyDigestStore {
  return new CachedReplyDigestStore(inner, cache.newTtlCache<ReplyDigest>(1024, ttl, clockValue), 0, 0);
}

/** Selects reply digests. Empty fields match all. */
export class ReplyDigestQuery {
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

  matches(item: ReplyDigest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyDigest[]): ReplyDigest[] {
    const matched = collections.filter(items, (candidate: ReplyDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyDigests(store: ReplyDigestStore, query: ReplyDigestQuery): ReplyDigest[] {
  return query.apply(store.list());
}
