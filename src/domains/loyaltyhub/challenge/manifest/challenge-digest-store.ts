import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeDigest } from "./challenge-digest.js";

/** Keeps challenge digests by code. */
export interface ChallengeDigestStore {
  find(code: string): ChallengeDigest | undefined;
  save(item: ChallengeDigest): void;
  remove(code: string): boolean;
  list(): ChallengeDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeDigestStore implements ChallengeDigestStore {
  items: Map<string, ChallengeDigest>;
  order: string[];

  constructor(items: Map<string, ChallengeDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeDigest): void {
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

  list(): ChallengeDigest[] {
    const out: ChallengeDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeDigestStore(): ChallengeDigestStore {
  return new MemoryChallengeDigestStore(new Map<string, ChallengeDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeDigestStore implements ChallengeDigestStore {
  inner: ChallengeDigestStore;
  cache: cache.TtlCache<ChallengeDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeDigestStore,
    cacheValue: cache.TtlCache<ChallengeDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeDigest | undefined {
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

  save(item: ChallengeDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeDigest[] {
    return this.inner.list();
  }
}

export function newCachedChallengeDigestStore(inner: ChallengeDigestStore, ttl: number, clockValue: clock.Clock): ChallengeDigestStore {
  return new CachedChallengeDigestStore(inner, cache.newTtlCache<ChallengeDigest>(64, ttl, clockValue), 0, 0);
}

/** Selects challenge digests. Empty fields match all. */
export class ChallengeDigestQuery {
  unit: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeDigest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeDigest[]): ChallengeDigest[] {
    const matched = collections.filter(items, (candidate: ChallengeDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeDigests(store: ChallengeDigestStore, query: ChallengeDigestQuery): ChallengeDigest[] {
  return query.apply(store.list());
}
