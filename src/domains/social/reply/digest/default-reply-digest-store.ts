import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultReplyDigest } from "./default-reply-digest.js";

/** Keeps default reply digests by code. */
export interface DefaultReplyDigestStore {
  find(code: string): DefaultReplyDigest | undefined;
  save(item: DefaultReplyDigest): void;
  remove(code: string): boolean;
  list(): DefaultReplyDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultReplyDigestStore implements DefaultReplyDigestStore {
  items: Map<string, DefaultReplyDigest>;
  order: string[];

  constructor(items: Map<string, DefaultReplyDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultReplyDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultReplyDigest): void {
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

  list(): DefaultReplyDigest[] {
    const out: DefaultReplyDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultReplyDigestStore(): DefaultReplyDigestStore {
  return new MemoryDefaultReplyDigestStore(new Map<string, DefaultReplyDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultReplyDigestStore implements DefaultReplyDigestStore {
  inner: DefaultReplyDigestStore;
  cache: cache.TtlCache<DefaultReplyDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultReplyDigestStore,
    cacheValue: cache.TtlCache<DefaultReplyDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultReplyDigest | undefined {
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

  save(item: DefaultReplyDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultReplyDigest[] {
    return this.inner.list();
  }
}

export function newCachedDefaultReplyDigestStore(inner: DefaultReplyDigestStore, ttl: number, clockValue: clock.Clock): DefaultReplyDigestStore {
  return new CachedDefaultReplyDigestStore(inner, cache.newTtlCache<DefaultReplyDigest>(128, ttl, clockValue), 0, 0);
}

/** Selects default reply digests. Empty fields match all. */
export class DefaultReplyDigestQuery {
  category: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.category = category;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultReplyDigest): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultReplyDigest[]): DefaultReplyDigest[] {
    const matched = collections.filter(items, (candidate: DefaultReplyDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultReplyDigests(store: DefaultReplyDigestStore, query: DefaultReplyDigestQuery): DefaultReplyDigest[] {
  return query.apply(store.list());
}
