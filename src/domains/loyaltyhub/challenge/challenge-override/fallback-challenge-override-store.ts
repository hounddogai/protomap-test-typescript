import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackChallengeOverride } from "./fallback-challenge-override.js";

/** Keeps fallback challenge overrides by code. */
export interface FallbackChallengeOverrideStore {
  find(code: string): FallbackChallengeOverride | undefined;
  save(item: FallbackChallengeOverride): void;
  remove(code: string): boolean;
  list(): FallbackChallengeOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackChallengeOverrideStore implements FallbackChallengeOverrideStore {
  items: Map<string, FallbackChallengeOverride>;
  order: string[];

  constructor(items: Map<string, FallbackChallengeOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackChallengeOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackChallengeOverride): void {
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

  list(): FallbackChallengeOverride[] {
    const out: FallbackChallengeOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackChallengeOverrideStore(): FallbackChallengeOverrideStore {
  return new MemoryFallbackChallengeOverrideStore(new Map<string, FallbackChallengeOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackChallengeOverrideStore implements FallbackChallengeOverrideStore {
  inner: FallbackChallengeOverrideStore;
  cache: cache.TtlCache<FallbackChallengeOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackChallengeOverrideStore,
    cacheValue: cache.TtlCache<FallbackChallengeOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackChallengeOverride | undefined {
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

  save(item: FallbackChallengeOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackChallengeOverride[] {
    return this.inner.list();
  }
}

export function newCachedFallbackChallengeOverrideStore(inner: FallbackChallengeOverrideStore, ttl: number, clockValue: clock.Clock): FallbackChallengeOverrideStore {
  return new CachedFallbackChallengeOverrideStore(
    inner,
    cache.newTtlCache<FallbackChallengeOverride>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback challenge overrides. Empty fields match all. */
export class FallbackChallengeOverrideQuery {
  country: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBudget: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackChallengeOverride): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackChallengeOverride[]): FallbackChallengeOverride[] {
    const matched = collections.filter(items, (candidate: FallbackChallengeOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackChallengeOverrides(store: FallbackChallengeOverrideStore, query: FallbackChallengeOverrideQuery): FallbackChallengeOverride[] {
  return query.apply(store.list());
}
