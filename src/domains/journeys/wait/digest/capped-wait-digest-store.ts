import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedWaitDigest } from "./capped-wait-digest.js";

/** Keeps capped wait digests by code. */
export interface CappedWaitDigestStore {
  find(code: string): CappedWaitDigest | undefined;
  save(item: CappedWaitDigest): void;
  remove(code: string): boolean;
  list(): CappedWaitDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedWaitDigestStore implements CappedWaitDigestStore {
  items: Map<string, CappedWaitDigest>;
  order: string[];

  constructor(items: Map<string, CappedWaitDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedWaitDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedWaitDigest): void {
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

  list(): CappedWaitDigest[] {
    const out: CappedWaitDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedWaitDigestStore(): CappedWaitDigestStore {
  return new MemoryCappedWaitDigestStore(new Map<string, CappedWaitDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedWaitDigestStore implements CappedWaitDigestStore {
  inner: CappedWaitDigestStore;
  cache: cache.TtlCache<CappedWaitDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedWaitDigestStore,
    cacheValue: cache.TtlCache<CappedWaitDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedWaitDigest | undefined {
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

  save(item: CappedWaitDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedWaitDigest[] {
    return this.inner.list();
  }
}

export function newCachedCappedWaitDigestStore(inner: CappedWaitDigestStore, ttl: number, clockValue: clock.Clock): CappedWaitDigestStore {
  return new CachedCappedWaitDigestStore(inner, cache.newTtlCache<CappedWaitDigest>(1024, ttl, clockValue), 0, 0);
}

/** Selects capped wait digests. Empty fields match all. */
export class CappedWaitDigestQuery {
  title: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAttempts: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedWaitDigest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedWaitDigest[]): CappedWaitDigest[] {
    const matched = collections.filter(items, (candidate: CappedWaitDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedWaitDigests(store: CappedWaitDigestStore, query: CappedWaitDigestQuery): CappedWaitDigest[] {
  return query.apply(store.list());
}
