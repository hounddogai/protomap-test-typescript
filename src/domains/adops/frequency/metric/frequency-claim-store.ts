import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyClaim } from "./frequency-claim.js";

/** Keeps frequency claims by code. */
export interface FrequencyClaimStore {
  find(code: string): FrequencyClaim | undefined;
  save(item: FrequencyClaim): void;
  remove(code: string): boolean;
  list(): FrequencyClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyClaimStore implements FrequencyClaimStore {
  items: Map<string, FrequencyClaim>;
  order: string[];

  constructor(items: Map<string, FrequencyClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyClaim): void {
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

  list(): FrequencyClaim[] {
    const out: FrequencyClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyClaimStore(): FrequencyClaimStore {
  return new MemoryFrequencyClaimStore(new Map<string, FrequencyClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyClaimStore implements FrequencyClaimStore {
  inner: FrequencyClaimStore;
  cache: cache.TtlCache<FrequencyClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyClaimStore,
    cacheValue: cache.TtlCache<FrequencyClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyClaim | undefined {
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

  save(item: FrequencyClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyClaim[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyClaimStore(inner: FrequencyClaimStore, ttl: number, clockValue: clock.Clock): FrequencyClaimStore {
  return new CachedFrequencyClaimStore(inner, cache.newTtlCache<FrequencyClaim>(1024, ttl, clockValue), 0, 0);
}

/** Selects frequency claims. Empty fields match all. */
export class FrequencyClaimQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyClaim): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyClaim[]): FrequencyClaim[] {
    const matched = collections.filter(items, (candidate: FrequencyClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyClaims(store: FrequencyClaimStore, query: FrequencyClaimQuery): FrequencyClaim[] {
  return query.apply(store.list());
}
