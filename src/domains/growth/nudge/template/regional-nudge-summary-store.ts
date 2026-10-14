import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalNudgeSummary } from "./regional-nudge-summary.js";

/** Keeps regional nudge summaries by code. */
export interface RegionalNudgeSummaryStore {
  find(code: string): RegionalNudgeSummary | undefined;
  save(item: RegionalNudgeSummary): void;
  remove(code: string): boolean;
  list(): RegionalNudgeSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalNudgeSummaryStore implements RegionalNudgeSummaryStore {
  items: Map<string, RegionalNudgeSummary>;
  order: string[];

  constructor(items: Map<string, RegionalNudgeSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalNudgeSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalNudgeSummary): void {
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

  list(): RegionalNudgeSummary[] {
    const out: RegionalNudgeSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalNudgeSummaryStore(): RegionalNudgeSummaryStore {
  return new MemoryRegionalNudgeSummaryStore(new Map<string, RegionalNudgeSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalNudgeSummaryStore implements RegionalNudgeSummaryStore {
  inner: RegionalNudgeSummaryStore;
  cache: cache.TtlCache<RegionalNudgeSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalNudgeSummaryStore,
    cacheValue: cache.TtlCache<RegionalNudgeSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalNudgeSummary | undefined {
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

  save(item: RegionalNudgeSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalNudgeSummary[] {
    return this.inner.list();
  }
}

export function newCachedRegionalNudgeSummaryStore(inner: RegionalNudgeSummaryStore, ttl: number, clockValue: clock.Clock): RegionalNudgeSummaryStore {
  return new CachedRegionalNudgeSummaryStore(
    inner,
    cache.newTtlCache<RegionalNudgeSummary>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional nudge summaries. Empty fields match all. */
export class RegionalNudgeSummaryQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalNudgeSummary): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalNudgeSummary[]): RegionalNudgeSummary[] {
    const matched = collections.filter(items, (candidate: RegionalNudgeSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalNudgeSummaries(store: RegionalNudgeSummaryStore, query: RegionalNudgeSummaryQuery): RegionalNudgeSummary[] {
  return query.apply(store.list());
}
