import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalChallengeProfile } from "./regional-challenge-profile.js";

/** Keeps regional challenge profiles by code. */
export interface RegionalChallengeProfileStore {
  find(code: string): RegionalChallengeProfile | undefined;
  save(item: RegionalChallengeProfile): void;
  remove(code: string): boolean;
  list(): RegionalChallengeProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalChallengeProfileStore implements RegionalChallengeProfileStore {
  items: Map<string, RegionalChallengeProfile>;
  order: string[];

  constructor(items: Map<string, RegionalChallengeProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalChallengeProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalChallengeProfile): void {
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

  list(): RegionalChallengeProfile[] {
    const out: RegionalChallengeProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalChallengeProfileStore(): RegionalChallengeProfileStore {
  return new MemoryRegionalChallengeProfileStore(new Map<string, RegionalChallengeProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalChallengeProfileStore implements RegionalChallengeProfileStore {
  inner: RegionalChallengeProfileStore;
  cache: cache.TtlCache<RegionalChallengeProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalChallengeProfileStore,
    cacheValue: cache.TtlCache<RegionalChallengeProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalChallengeProfile | undefined {
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

  save(item: RegionalChallengeProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalChallengeProfile[] {
    return this.inner.list();
  }
}

export function newCachedRegionalChallengeProfileStore(inner: RegionalChallengeProfileStore, ttl: number, clockValue: clock.Clock): RegionalChallengeProfileStore {
  return new CachedRegionalChallengeProfileStore(
    inner,
    cache.newTtlCache<RegionalChallengeProfile>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional challenge profiles. Empty fields match all. */
export class RegionalChallengeProfileQuery {
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

  matches(item: RegionalChallengeProfile): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalChallengeProfile[]): RegionalChallengeProfile[] {
    const matched = collections.filter(items, (candidate: RegionalChallengeProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalChallengeProfiles(store: RegionalChallengeProfileStore, query: RegionalChallengeProfileQuery): RegionalChallengeProfile[] {
  return query.apply(store.list());
}
