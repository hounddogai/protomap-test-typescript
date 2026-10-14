import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeRollup } from "./challenge-rollup.js";

/** Keeps challenge rollups by code. */
export interface ChallengeRollupStore {
  find(code: string): ChallengeRollup | undefined;
  save(item: ChallengeRollup): void;
  remove(code: string): boolean;
  list(): ChallengeRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeRollupStore implements ChallengeRollupStore {
  items: Map<string, ChallengeRollup>;
  order: string[];

  constructor(items: Map<string, ChallengeRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeRollup): void {
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

  list(): ChallengeRollup[] {
    const out: ChallengeRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeRollupStore(): ChallengeRollupStore {
  return new MemoryChallengeRollupStore(new Map<string, ChallengeRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeRollupStore implements ChallengeRollupStore {
  inner: ChallengeRollupStore;
  cache: cache.TtlCache<ChallengeRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeRollupStore,
    cacheValue: cache.TtlCache<ChallengeRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeRollup | undefined {
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

  save(item: ChallengeRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeRollup[] {
    return this.inner.list();
  }
}

export function newCachedChallengeRollupStore(inner: ChallengeRollupStore, ttl: number, clockValue: clock.Clock): ChallengeRollupStore {
  return new CachedChallengeRollupStore(inner, cache.newTtlCache<ChallengeRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects challenge rollups. Empty fields match all. */
export class ChallengeRollupQuery {
  country: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minGraceDays: number, statuses: string[], limit: number) {
    this.country = country;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeRollup): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeRollup[]): ChallengeRollup[] {
    const matched = collections.filter(items, (candidate: ChallengeRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeRollups(store: ChallengeRollupStore, query: ChallengeRollupQuery): ChallengeRollup[] {
  return query.apply(store.list());
}
