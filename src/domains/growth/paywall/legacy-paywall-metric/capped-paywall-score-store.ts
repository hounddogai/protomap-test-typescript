import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPaywallScore } from "./capped-paywall-score.js";

/** Keeps capped paywall scores by code. */
export interface CappedPaywallScoreStore {
  find(code: string): CappedPaywallScore | undefined;
  save(item: CappedPaywallScore): void;
  remove(code: string): boolean;
  list(): CappedPaywallScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPaywallScoreStore implements CappedPaywallScoreStore {
  items: Map<string, CappedPaywallScore>;
  order: string[];

  constructor(items: Map<string, CappedPaywallScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPaywallScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPaywallScore): void {
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

  list(): CappedPaywallScore[] {
    const out: CappedPaywallScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPaywallScoreStore(): CappedPaywallScoreStore {
  return new MemoryCappedPaywallScoreStore(new Map<string, CappedPaywallScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPaywallScoreStore implements CappedPaywallScoreStore {
  inner: CappedPaywallScoreStore;
  cache: cache.TtlCache<CappedPaywallScore>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPaywallScoreStore,
    cacheValue: cache.TtlCache<CappedPaywallScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPaywallScore | undefined {
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

  save(item: CappedPaywallScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPaywallScore[] {
    return this.inner.list();
  }
}

export function newCachedCappedPaywallScoreStore(inner: CappedPaywallScoreStore, ttl: number, clockValue: clock.Clock): CappedPaywallScoreStore {
  return new CachedCappedPaywallScoreStore(inner, cache.newTtlCache<CappedPaywallScore>(512, ttl, clockValue), 0, 0);
}

/** Selects capped paywall scores. Empty fields match all. */
export class CappedPaywallScoreQuery {
  source: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minConversionRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPaywallScore): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPaywallScore[]): CappedPaywallScore[] {
    const matched = collections.filter(items, (candidate: CappedPaywallScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPaywallScores(store: CappedPaywallScoreStore, query: CappedPaywallScoreQuery): CappedPaywallScore[] {
  return query.apply(store.list());
}
