import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryActivationDigest } from "./primary-activation-digest.js";

/** Keeps primary activation digests by code. */
export interface PrimaryActivationDigestStore {
  find(code: string): PrimaryActivationDigest | undefined;
  save(item: PrimaryActivationDigest): void;
  remove(code: string): boolean;
  list(): PrimaryActivationDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryActivationDigestStore implements PrimaryActivationDigestStore {
  items: Map<string, PrimaryActivationDigest>;
  order: string[];

  constructor(items: Map<string, PrimaryActivationDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryActivationDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryActivationDigest): void {
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

  list(): PrimaryActivationDigest[] {
    const out: PrimaryActivationDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryActivationDigestStore(): PrimaryActivationDigestStore {
  return new MemoryPrimaryActivationDigestStore(new Map<string, PrimaryActivationDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryActivationDigestStore implements PrimaryActivationDigestStore {
  inner: PrimaryActivationDigestStore;
  cache: cache.TtlCache<PrimaryActivationDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryActivationDigestStore,
    cacheValue: cache.TtlCache<PrimaryActivationDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryActivationDigest | undefined {
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

  save(item: PrimaryActivationDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryActivationDigest[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryActivationDigestStore(inner: PrimaryActivationDigestStore, ttl: number, clockValue: clock.Clock): PrimaryActivationDigestStore {
  return new CachedPrimaryActivationDigestStore(
    inner,
    cache.newTtlCache<PrimaryActivationDigest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary activation digests. Empty fields match all. */
export class PrimaryActivationDigestQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryActivationDigest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryActivationDigest[]): PrimaryActivationDigest[] {
    const matched = collections.filter(items, (candidate: PrimaryActivationDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryActivationDigests(store: PrimaryActivationDigestStore, query: PrimaryActivationDigestQuery): PrimaryActivationDigest[] {
  return query.apply(store.list());
}
