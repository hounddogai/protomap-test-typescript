import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPaywallScore } from "./strict-paywall-score.js";

/** Keeps strict paywall scores by code. */
export interface StrictPaywallScoreStore {
  find(code: string): StrictPaywallScore | undefined;
  save(item: StrictPaywallScore): void;
  remove(code: string): boolean;
  list(): StrictPaywallScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPaywallScoreStore implements StrictPaywallScoreStore {
  items: Map<string, StrictPaywallScore>;
  order: string[];

  constructor(items: Map<string, StrictPaywallScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPaywallScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPaywallScore): void {
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

  list(): StrictPaywallScore[] {
    const out: StrictPaywallScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPaywallScoreStore(): StrictPaywallScoreStore {
  return new MemoryStrictPaywallScoreStore(new Map<string, StrictPaywallScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPaywallScoreStore implements StrictPaywallScoreStore {
  inner: StrictPaywallScoreStore;
  cache: cache.TtlCache<StrictPaywallScore>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPaywallScoreStore,
    cacheValue: cache.TtlCache<StrictPaywallScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPaywallScore | undefined {
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

  save(item: StrictPaywallScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPaywallScore[] {
    return this.inner.list();
  }
}

export function newCachedStrictPaywallScoreStore(inner: StrictPaywallScoreStore, ttl: number, clockValue: clock.Clock): StrictPaywallScoreStore {
  return new CachedStrictPaywallScoreStore(inner, cache.newTtlCache<StrictPaywallScore>(128, ttl, clockValue), 0, 0);
}

/** Selects strict paywall scores. Empty fields match all. */
export class StrictPaywallScoreQuery {
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

  matches(item: StrictPaywallScore): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPaywallScore[]): StrictPaywallScore[] {
    const matched = collections.filter(items, (candidate: StrictPaywallScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPaywallScores(store: StrictPaywallScoreStore, query: StrictPaywallScoreQuery): StrictPaywallScore[] {
  return query.apply(store.list());
}
