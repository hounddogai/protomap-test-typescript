import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultEnrollmentDigest } from "./default-enrollment-digest.js";

/** Keeps default enrollment digests by code. */
export interface DefaultEnrollmentDigestStore {
  find(code: string): DefaultEnrollmentDigest | undefined;
  save(item: DefaultEnrollmentDigest): void;
  remove(code: string): boolean;
  list(): DefaultEnrollmentDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultEnrollmentDigestStore implements DefaultEnrollmentDigestStore {
  items: Map<string, DefaultEnrollmentDigest>;
  order: string[];

  constructor(items: Map<string, DefaultEnrollmentDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultEnrollmentDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultEnrollmentDigest): void {
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

  list(): DefaultEnrollmentDigest[] {
    const out: DefaultEnrollmentDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultEnrollmentDigestStore(): DefaultEnrollmentDigestStore {
  return new MemoryDefaultEnrollmentDigestStore(new Map<string, DefaultEnrollmentDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultEnrollmentDigestStore implements DefaultEnrollmentDigestStore {
  inner: DefaultEnrollmentDigestStore;
  cache: cache.TtlCache<DefaultEnrollmentDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultEnrollmentDigestStore,
    cacheValue: cache.TtlCache<DefaultEnrollmentDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultEnrollmentDigest | undefined {
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

  save(item: DefaultEnrollmentDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultEnrollmentDigest[] {
    return this.inner.list();
  }
}

export function newCachedDefaultEnrollmentDigestStore(inner: DefaultEnrollmentDigestStore, ttl: number, clockValue: clock.Clock): DefaultEnrollmentDigestStore {
  return new CachedDefaultEnrollmentDigestStore(
    inner,
    cache.newTtlCache<DefaultEnrollmentDigest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default enrollment digests. Empty fields match all. */
export class DefaultEnrollmentDigestQuery {
  segment: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minStartsAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultEnrollmentDigest): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultEnrollmentDigest[]): DefaultEnrollmentDigest[] {
    const matched = collections.filter(items, (candidate: DefaultEnrollmentDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultEnrollmentDigests(store: DefaultEnrollmentDigestStore, query: DefaultEnrollmentDigestQuery): DefaultEnrollmentDigest[] {
  return query.apply(store.list());
}
