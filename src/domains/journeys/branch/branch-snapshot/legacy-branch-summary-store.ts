import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyBranchSummary } from "./legacy-branch-summary.js";

/** Keeps legacy branch summaries by code. */
export interface LegacyBranchSummaryStore {
  find(code: string): LegacyBranchSummary | undefined;
  save(item: LegacyBranchSummary): void;
  remove(code: string): boolean;
  list(): LegacyBranchSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyBranchSummaryStore implements LegacyBranchSummaryStore {
  items: Map<string, LegacyBranchSummary>;
  order: string[];

  constructor(items: Map<string, LegacyBranchSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyBranchSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyBranchSummary): void {
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

  list(): LegacyBranchSummary[] {
    const out: LegacyBranchSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyBranchSummaryStore(): LegacyBranchSummaryStore {
  return new MemoryLegacyBranchSummaryStore(new Map<string, LegacyBranchSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyBranchSummaryStore implements LegacyBranchSummaryStore {
  inner: LegacyBranchSummaryStore;
  cache: cache.TtlCache<LegacyBranchSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyBranchSummaryStore,
    cacheValue: cache.TtlCache<LegacyBranchSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyBranchSummary | undefined {
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

  save(item: LegacyBranchSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyBranchSummary[] {
    return this.inner.list();
  }
}

export function newCachedLegacyBranchSummaryStore(inner: LegacyBranchSummaryStore, ttl: number, clockValue: clock.Clock): LegacyBranchSummaryStore {
  return new CachedLegacyBranchSummaryStore(inner, cache.newTtlCache<LegacyBranchSummary>(64, ttl, clockValue), 0, 0);
}

/** Selects legacy branch summaries. Empty fields match all. */
export class LegacyBranchSummaryQuery {
  label: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDiscount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyBranchSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyBranchSummary[]): LegacyBranchSummary[] {
    const matched = collections.filter(items, (candidate: LegacyBranchSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyBranchSummaries(store: LegacyBranchSummaryStore, query: LegacyBranchSummaryQuery): LegacyBranchSummary[] {
  return query.apply(store.list());
}
