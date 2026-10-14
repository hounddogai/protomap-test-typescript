import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalCsatPolicy } from "./seasonal-csat-policy.js";

/** Keeps seasonal csat policies by code. */
export interface SeasonalCsatPolicyStore {
  find(code: string): SeasonalCsatPolicy | undefined;
  save(item: SeasonalCsatPolicy): void;
  remove(code: string): boolean;
  list(): SeasonalCsatPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalCsatPolicyStore implements SeasonalCsatPolicyStore {
  items: Map<string, SeasonalCsatPolicy>;
  order: string[];

  constructor(items: Map<string, SeasonalCsatPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalCsatPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalCsatPolicy): void {
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

  list(): SeasonalCsatPolicy[] {
    const out: SeasonalCsatPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalCsatPolicyStore(): SeasonalCsatPolicyStore {
  return new MemorySeasonalCsatPolicyStore(new Map<string, SeasonalCsatPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalCsatPolicyStore implements SeasonalCsatPolicyStore {
  inner: SeasonalCsatPolicyStore;
  cache: cache.TtlCache<SeasonalCsatPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalCsatPolicyStore,
    cacheValue: cache.TtlCache<SeasonalCsatPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalCsatPolicy | undefined {
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

  save(item: SeasonalCsatPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalCsatPolicy[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalCsatPolicyStore(inner: SeasonalCsatPolicyStore, ttl: number, clockValue: clock.Clock): SeasonalCsatPolicyStore {
  return new CachedSeasonalCsatPolicyStore(inner, cache.newTtlCache<SeasonalCsatPolicy>(64, ttl, clockValue), 0, 0);
}

/** Selects seasonal csat policies. Empty fields match all. */
export class SeasonalCsatPolicyQuery {
  channel: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minEndsAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalCsatPolicy): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalCsatPolicy[]): SeasonalCsatPolicy[] {
    const matched = collections.filter(items, (candidate: SeasonalCsatPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalCsatPolicies(store: SeasonalCsatPolicyStore, query: SeasonalCsatPolicyQuery): SeasonalCsatPolicy[] {
  return query.apply(store.list());
}
