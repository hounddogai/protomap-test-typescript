import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeBundle } from "./challenge-bundle.js";

/** Keeps challenge bundles by code. */
export interface ChallengeBundleStore {
  find(code: string): ChallengeBundle | undefined;
  save(item: ChallengeBundle): void;
  remove(code: string): boolean;
  list(): ChallengeBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeBundleStore implements ChallengeBundleStore {
  items: Map<string, ChallengeBundle>;
  order: string[];

  constructor(items: Map<string, ChallengeBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeBundle): void {
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

  list(): ChallengeBundle[] {
    const out: ChallengeBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeBundleStore(): ChallengeBundleStore {
  return new MemoryChallengeBundleStore(new Map<string, ChallengeBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeBundleStore implements ChallengeBundleStore {
  inner: ChallengeBundleStore;
  cache: cache.TtlCache<ChallengeBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeBundleStore,
    cacheValue: cache.TtlCache<ChallengeBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeBundle | undefined {
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

  save(item: ChallengeBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeBundle[] {
    return this.inner.list();
  }
}

export function newCachedChallengeBundleStore(inner: ChallengeBundleStore, ttl: number, clockValue: clock.Clock): ChallengeBundleStore {
  return new CachedChallengeBundleStore(inner, cache.newTtlCache<ChallengeBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects challenge bundles. Empty fields match all. */
export class ChallengeBundleQuery {
  utmSource: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minGraceDays: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeBundle): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeBundle[]): ChallengeBundle[] {
    const matched = collections.filter(items, (candidate: ChallengeBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeBundles(store: ChallengeBundleStore, query: ChallengeBundleQuery): ChallengeBundle[] {
  return query.apply(store.list());
}
