import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictReputationSummary } from "./strict-reputation-summary.js";

/** Keeps strict reputation summaries by code. */
export interface StrictReputationSummaryStore {
  find(code: string): StrictReputationSummary | undefined;
  save(item: StrictReputationSummary): void;
  remove(code: string): boolean;
  list(): StrictReputationSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictReputationSummaryStore implements StrictReputationSummaryStore {
  items: Map<string, StrictReputationSummary>;
  order: string[];

  constructor(items: Map<string, StrictReputationSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictReputationSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictReputationSummary): void {
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

  list(): StrictReputationSummary[] {
    const out: StrictReputationSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictReputationSummaryStore(): StrictReputationSummaryStore {
  return new MemoryStrictReputationSummaryStore(new Map<string, StrictReputationSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictReputationSummaryStore implements StrictReputationSummaryStore {
  inner: StrictReputationSummaryStore;
  cache: cache.TtlCache<StrictReputationSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictReputationSummaryStore,
    cacheValue: cache.TtlCache<StrictReputationSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictReputationSummary | undefined {
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

  save(item: StrictReputationSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictReputationSummary[] {
    return this.inner.list();
  }
}

export function newCachedStrictReputationSummaryStore(inner: StrictReputationSummaryStore, ttl: number, clockValue: clock.Clock): StrictReputationSummaryStore {
  return new CachedStrictReputationSummaryStore(
    inner,
    cache.newTtlCache<StrictReputationSummary>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict reputation summaries. Empty fields match all. */
export class StrictReputationSummaryQuery {
  title: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minQuantity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictReputationSummary): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictReputationSummary[]): StrictReputationSummary[] {
    const matched = collections.filter(items, (candidate: StrictReputationSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictReputationSummaries(store: StrictReputationSummaryStore, query: StrictReputationSummaryQuery): StrictReputationSummary[] {
  return query.apply(store.list());
}
