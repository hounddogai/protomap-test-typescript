import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPaywallSummary } from "./capped-paywall-summary.js";

/** Keeps capped paywall summaries by code. */
export interface CappedPaywallSummaryStore {
  find(code: string): CappedPaywallSummary | undefined;
  save(item: CappedPaywallSummary): void;
  remove(code: string): boolean;
  list(): CappedPaywallSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPaywallSummaryStore implements CappedPaywallSummaryStore {
  items: Map<string, CappedPaywallSummary>;
  order: string[];

  constructor(items: Map<string, CappedPaywallSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPaywallSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPaywallSummary): void {
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

  list(): CappedPaywallSummary[] {
    const out: CappedPaywallSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPaywallSummaryStore(): CappedPaywallSummaryStore {
  return new MemoryCappedPaywallSummaryStore(new Map<string, CappedPaywallSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPaywallSummaryStore implements CappedPaywallSummaryStore {
  inner: CappedPaywallSummaryStore;
  cache: cache.TtlCache<CappedPaywallSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPaywallSummaryStore,
    cacheValue: cache.TtlCache<CappedPaywallSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPaywallSummary | undefined {
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

  save(item: CappedPaywallSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPaywallSummary[] {
    return this.inner.list();
  }
}

export function newCachedCappedPaywallSummaryStore(inner: CappedPaywallSummaryStore, ttl: number, clockValue: clock.Clock): CappedPaywallSummaryStore {
  return new CachedCappedPaywallSummaryStore(inner, cache.newTtlCache<CappedPaywallSummary>(64, ttl, clockValue), 0, 0);
}

/** Selects capped paywall summaries. Empty fields match all. */
export class CappedPaywallSummaryQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPaywallSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPaywallSummary[]): CappedPaywallSummary[] {
    const matched = collections.filter(items, (candidate: CappedPaywallSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPaywallSummaries(store: CappedPaywallSummaryStore, query: CappedPaywallSummaryQuery): CappedPaywallSummary[] {
  return query.apply(store.list());
}
