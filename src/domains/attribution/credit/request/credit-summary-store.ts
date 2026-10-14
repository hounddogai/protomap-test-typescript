import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditSummary } from "./credit-summary.js";

/** Keeps credit summaries by code. */
export interface CreditSummaryStore {
  find(code: string): CreditSummary | undefined;
  save(item: CreditSummary): void;
  remove(code: string): boolean;
  list(): CreditSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditSummaryStore implements CreditSummaryStore {
  items: Map<string, CreditSummary>;
  order: string[];

  constructor(items: Map<string, CreditSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditSummary): void {
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

  list(): CreditSummary[] {
    const out: CreditSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditSummaryStore(): CreditSummaryStore {
  return new MemoryCreditSummaryStore(new Map<string, CreditSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditSummaryStore implements CreditSummaryStore {
  inner: CreditSummaryStore;
  cache: cache.TtlCache<CreditSummary>;
  hits: number;
  misses: number;

  constructor(inner: CreditSummaryStore, cacheValue: cache.TtlCache<CreditSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditSummary | undefined {
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

  save(item: CreditSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditSummary[] {
    return this.inner.list();
  }
}

export function newCachedCreditSummaryStore(inner: CreditSummaryStore, ttl: number, clockValue: clock.Clock): CreditSummaryStore {
  return new CachedCreditSummaryStore(inner, cache.newTtlCache<CreditSummary>(64, ttl, clockValue), 0, 0);
}

/** Selects credit summaries. Empty fields match all. */
export class CreditSummaryQuery {
  locale: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minOpenRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditSummary[]): CreditSummary[] {
    const matched = collections.filter(items, (candidate: CreditSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditSummaries(store: CreditSummaryStore, query: CreditSummaryQuery): CreditSummary[] {
  return query.apply(store.list());
}
