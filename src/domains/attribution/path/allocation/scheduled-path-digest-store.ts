import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledPathDigest } from "./scheduled-path-digest.js";

/** Keeps scheduled path digests by code. */
export interface ScheduledPathDigestStore {
  find(code: string): ScheduledPathDigest | undefined;
  save(item: ScheduledPathDigest): void;
  remove(code: string): boolean;
  list(): ScheduledPathDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledPathDigestStore implements ScheduledPathDigestStore {
  items: Map<string, ScheduledPathDigest>;
  order: string[];

  constructor(items: Map<string, ScheduledPathDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledPathDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledPathDigest): void {
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

  list(): ScheduledPathDigest[] {
    const out: ScheduledPathDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledPathDigestStore(): ScheduledPathDigestStore {
  return new MemoryScheduledPathDigestStore(new Map<string, ScheduledPathDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledPathDigestStore implements ScheduledPathDigestStore {
  inner: ScheduledPathDigestStore;
  cache: cache.TtlCache<ScheduledPathDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledPathDigestStore,
    cacheValue: cache.TtlCache<ScheduledPathDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledPathDigest | undefined {
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

  save(item: ScheduledPathDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledPathDigest[] {
    return this.inner.list();
  }
}

export function newCachedScheduledPathDigestStore(inner: ScheduledPathDigestStore, ttl: number, clockValue: clock.Clock): ScheduledPathDigestStore {
  return new CachedScheduledPathDigestStore(inner, cache.newTtlCache<ScheduledPathDigest>(256, ttl, clockValue), 0, 0);
}

/** Selects scheduled path digests. Empty fields match all. */
export class ScheduledPathDigestQuery {
  utmSource: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minFloorValue: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledPathDigest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledPathDigest[]): ScheduledPathDigest[] {
    const matched = collections.filter(items, (candidate: ScheduledPathDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledPathDigests(store: ScheduledPathDigestStore, query: ScheduledPathDigestQuery): ScheduledPathDigest[] {
  return query.apply(store.list());
}
