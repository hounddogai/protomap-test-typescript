import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredSenderDigest } from "./tiered-sender-digest.js";

/** Keeps tiered sender digests by code. */
export interface TieredSenderDigestStore {
  find(code: string): TieredSenderDigest | undefined;
  save(item: TieredSenderDigest): void;
  remove(code: string): boolean;
  list(): TieredSenderDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredSenderDigestStore implements TieredSenderDigestStore {
  items: Map<string, TieredSenderDigest>;
  order: string[];

  constructor(items: Map<string, TieredSenderDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredSenderDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredSenderDigest): void {
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

  list(): TieredSenderDigest[] {
    const out: TieredSenderDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredSenderDigestStore(): TieredSenderDigestStore {
  return new MemoryTieredSenderDigestStore(new Map<string, TieredSenderDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredSenderDigestStore implements TieredSenderDigestStore {
  inner: TieredSenderDigestStore;
  cache: cache.TtlCache<TieredSenderDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredSenderDigestStore,
    cacheValue: cache.TtlCache<TieredSenderDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredSenderDigest | undefined {
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

  save(item: TieredSenderDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredSenderDigest[] {
    return this.inner.list();
  }
}

export function newCachedTieredSenderDigestStore(inner: TieredSenderDigestStore, ttl: number, clockValue: clock.Clock): TieredSenderDigestStore {
  return new CachedTieredSenderDigestStore(inner, cache.newTtlCache<TieredSenderDigest>(128, ttl, clockValue), 0, 0);
}

/** Selects tiered sender digests. Empty fields match all. */
export class TieredSenderDigestQuery {
  locale: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMaximum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredSenderDigest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredSenderDigest[]): TieredSenderDigest[] {
    const matched = collections.filter(items, (candidate: TieredSenderDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredSenderDigests(store: TieredSenderDigestStore, query: TieredSenderDigestQuery): TieredSenderDigest[] {
  return query.apply(store.list());
}
