import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalFrequencyPolicy } from "./seasonal-frequency-policy.js";

/** Keeps seasonal frequency policies by code. */
export interface SeasonalFrequencyPolicyStore {
  find(code: string): SeasonalFrequencyPolicy | undefined;
  save(item: SeasonalFrequencyPolicy): void;
  remove(code: string): boolean;
  list(): SeasonalFrequencyPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalFrequencyPolicyStore implements SeasonalFrequencyPolicyStore {
  items: Map<string, SeasonalFrequencyPolicy>;
  order: string[];

  constructor(items: Map<string, SeasonalFrequencyPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalFrequencyPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalFrequencyPolicy): void {
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

  list(): SeasonalFrequencyPolicy[] {
    const out: SeasonalFrequencyPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalFrequencyPolicyStore(): SeasonalFrequencyPolicyStore {
  return new MemorySeasonalFrequencyPolicyStore(new Map<string, SeasonalFrequencyPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalFrequencyPolicyStore implements SeasonalFrequencyPolicyStore {
  inner: SeasonalFrequencyPolicyStore;
  cache: cache.TtlCache<SeasonalFrequencyPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalFrequencyPolicyStore,
    cacheValue: cache.TtlCache<SeasonalFrequencyPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalFrequencyPolicy | undefined {
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

  save(item: SeasonalFrequencyPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalFrequencyPolicy[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalFrequencyPolicyStore(inner: SeasonalFrequencyPolicyStore, ttl: number, clockValue: clock.Clock): SeasonalFrequencyPolicyStore {
  return new CachedSeasonalFrequencyPolicyStore(
    inner,
    cache.newTtlCache<SeasonalFrequencyPolicy>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal frequency policies. Empty fields match all. */
export class SeasonalFrequencyPolicyQuery {
  locale: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minQuantity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalFrequencyPolicy): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalFrequencyPolicy[]): SeasonalFrequencyPolicy[] {
    const matched = collections.filter(items, (candidate: SeasonalFrequencyPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalFrequencyPolicies(store: SeasonalFrequencyPolicyStore, query: SeasonalFrequencyPolicyQuery): SeasonalFrequencyPolicy[] {
  return query.apply(store.list());
}
