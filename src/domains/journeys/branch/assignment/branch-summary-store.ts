import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchSummary } from "./branch-summary.js";

/** Keeps branch summaries by code. */
export interface BranchSummaryStore {
  find(code: string): BranchSummary | undefined;
  save(item: BranchSummary): void;
  remove(code: string): boolean;
  list(): BranchSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchSummaryStore implements BranchSummaryStore {
  items: Map<string, BranchSummary>;
  order: string[];

  constructor(items: Map<string, BranchSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchSummary): void {
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

  list(): BranchSummary[] {
    const out: BranchSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchSummaryStore(): BranchSummaryStore {
  return new MemoryBranchSummaryStore(new Map<string, BranchSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchSummaryStore implements BranchSummaryStore {
  inner: BranchSummaryStore;
  cache: cache.TtlCache<BranchSummary>;
  hits: number;
  misses: number;

  constructor(inner: BranchSummaryStore, cacheValue: cache.TtlCache<BranchSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchSummary | undefined {
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

  save(item: BranchSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchSummary[] {
    return this.inner.list();
  }
}

export function newCachedBranchSummaryStore(inner: BranchSummaryStore, ttl: number, clockValue: clock.Clock): BranchSummaryStore {
  return new CachedBranchSummaryStore(inner, cache.newTtlCache<BranchSummary>(128, ttl, clockValue), 0, 0);
}

/** Selects branch summaries. Empty fields match all. */
export class BranchSummaryQuery {
  locale: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSendAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchSummary[]): BranchSummary[] {
    const matched = collections.filter(items, (candidate: BranchSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchSummaries(store: BranchSummaryStore, query: BranchSummaryQuery): BranchSummary[] {
  return query.apply(store.list());
}
