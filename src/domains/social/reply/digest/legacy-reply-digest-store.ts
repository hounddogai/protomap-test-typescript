import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyReplyDigest } from "./legacy-reply-digest.js";

/** Keeps legacy reply digests by code. */
export interface LegacyReplyDigestStore {
  find(code: string): LegacyReplyDigest | undefined;
  save(item: LegacyReplyDigest): void;
  remove(code: string): boolean;
  list(): LegacyReplyDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyReplyDigestStore implements LegacyReplyDigestStore {
  items: Map<string, LegacyReplyDigest>;
  order: string[];

  constructor(items: Map<string, LegacyReplyDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyReplyDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyReplyDigest): void {
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

  list(): LegacyReplyDigest[] {
    const out: LegacyReplyDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyReplyDigestStore(): LegacyReplyDigestStore {
  return new MemoryLegacyReplyDigestStore(new Map<string, LegacyReplyDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyReplyDigestStore implements LegacyReplyDigestStore {
  inner: LegacyReplyDigestStore;
  cache: cache.TtlCache<LegacyReplyDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyReplyDigestStore,
    cacheValue: cache.TtlCache<LegacyReplyDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyReplyDigest | undefined {
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

  save(item: LegacyReplyDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyReplyDigest[] {
    return this.inner.list();
  }
}

export function newCachedLegacyReplyDigestStore(inner: LegacyReplyDigestStore, ttl: number, clockValue: clock.Clock): LegacyReplyDigestStore {
  return new CachedLegacyReplyDigestStore(inner, cache.newTtlCache<LegacyReplyDigest>(64, ttl, clockValue), 0, 0);
}

/** Selects legacy reply digests. Empty fields match all. */
export class LegacyReplyDigestQuery {
  locale: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBid: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyReplyDigest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyReplyDigest[]): LegacyReplyDigest[] {
    const matched = collections.filter(items, (candidate: LegacyReplyDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyReplyDigests(store: LegacyReplyDigestStore, query: LegacyReplyDigestQuery): LegacyReplyDigest[] {
  return query.apply(store.list());
}
