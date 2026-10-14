import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardDigest } from "./reward-digest.js";

/** Keeps reward digests by code. */
export interface RewardDigestStore {
  find(code: string): RewardDigest | undefined;
  save(item: RewardDigest): void;
  remove(code: string): boolean;
  list(): RewardDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardDigestStore implements RewardDigestStore {
  items: Map<string, RewardDigest>;
  order: string[];

  constructor(items: Map<string, RewardDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardDigest): void {
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

  list(): RewardDigest[] {
    const out: RewardDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardDigestStore(): RewardDigestStore {
  return new MemoryRewardDigestStore(new Map<string, RewardDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardDigestStore implements RewardDigestStore {
  inner: RewardDigestStore;
  cache: cache.TtlCache<RewardDigest>;
  hits: number;
  misses: number;

  constructor(inner: RewardDigestStore, cacheValue: cache.TtlCache<RewardDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardDigest | undefined {
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

  save(item: RewardDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardDigest[] {
    return this.inner.list();
  }
}

export function newCachedRewardDigestStore(inner: RewardDigestStore, ttl: number, clockValue: clock.Clock): RewardDigestStore {
  return new CachedRewardDigestStore(inner, cache.newTtlCache<RewardDigest>(64, ttl, clockValue), 0, 0);
}

/** Selects reward digests. Empty fields match all. */
export class RewardDigestQuery {
  country: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minLimit: number, statuses: string[], limit: number) {
    this.country = country;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardDigest): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardDigest[]): RewardDigest[] {
    const matched = collections.filter(items, (candidate: RewardDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardDigests(store: RewardDigestStore, query: RewardDigestQuery): RewardDigest[] {
  return query.apply(store.list());
}
