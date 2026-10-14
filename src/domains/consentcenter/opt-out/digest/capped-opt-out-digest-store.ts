import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedOptOutDigest } from "./capped-opt-out-digest.js";

/** Keeps capped opt out digests by code. */
export interface CappedOptOutDigestStore {
  find(code: string): CappedOptOutDigest | undefined;
  save(item: CappedOptOutDigest): void;
  remove(code: string): boolean;
  list(): CappedOptOutDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedOptOutDigestStore implements CappedOptOutDigestStore {
  items: Map<string, CappedOptOutDigest>;
  order: string[];

  constructor(items: Map<string, CappedOptOutDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedOptOutDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedOptOutDigest): void {
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

  list(): CappedOptOutDigest[] {
    const out: CappedOptOutDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedOptOutDigestStore(): CappedOptOutDigestStore {
  return new MemoryCappedOptOutDigestStore(new Map<string, CappedOptOutDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedOptOutDigestStore implements CappedOptOutDigestStore {
  inner: CappedOptOutDigestStore;
  cache: cache.TtlCache<CappedOptOutDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedOptOutDigestStore,
    cacheValue: cache.TtlCache<CappedOptOutDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedOptOutDigest | undefined {
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

  save(item: CappedOptOutDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedOptOutDigest[] {
    return this.inner.list();
  }
}

export function newCachedCappedOptOutDigestStore(inner: CappedOptOutDigestStore, ttl: number, clockValue: clock.Clock): CappedOptOutDigestStore {
  return new CachedCappedOptOutDigestStore(inner, cache.newTtlCache<CappedOptOutDigest>(128, ttl, clockValue), 0, 0);
}

/** Selects capped opt out digests. Empty fields match all. */
export class CappedOptOutDigestQuery {
  region: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minPriority: number, statuses: string[], limit: number) {
    this.region = region;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedOptOutDigest): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedOptOutDigest[]): CappedOptOutDigest[] {
    const matched = collections.filter(items, (candidate: CappedOptOutDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedOptOutDigests(store: CappedOptOutDigestStore, query: CappedOptOutDigestQuery): CappedOptOutDigest[] {
  return query.apply(store.list());
}
