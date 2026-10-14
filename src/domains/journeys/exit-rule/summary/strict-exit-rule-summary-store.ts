import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictExitRuleSummary } from "./strict-exit-rule-summary.js";

/** Keeps strict exit rule summaries by code. */
export interface StrictExitRuleSummaryStore {
  find(code: string): StrictExitRuleSummary | undefined;
  save(item: StrictExitRuleSummary): void;
  remove(code: string): boolean;
  list(): StrictExitRuleSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictExitRuleSummaryStore implements StrictExitRuleSummaryStore {
  items: Map<string, StrictExitRuleSummary>;
  order: string[];

  constructor(items: Map<string, StrictExitRuleSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictExitRuleSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictExitRuleSummary): void {
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

  list(): StrictExitRuleSummary[] {
    const out: StrictExitRuleSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictExitRuleSummaryStore(): StrictExitRuleSummaryStore {
  return new MemoryStrictExitRuleSummaryStore(new Map<string, StrictExitRuleSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictExitRuleSummaryStore implements StrictExitRuleSummaryStore {
  inner: StrictExitRuleSummaryStore;
  cache: cache.TtlCache<StrictExitRuleSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictExitRuleSummaryStore,
    cacheValue: cache.TtlCache<StrictExitRuleSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictExitRuleSummary | undefined {
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

  save(item: StrictExitRuleSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictExitRuleSummary[] {
    return this.inner.list();
  }
}

export function newCachedStrictExitRuleSummaryStore(inner: StrictExitRuleSummaryStore, ttl: number, clockValue: clock.Clock): StrictExitRuleSummaryStore {
  return new CachedStrictExitRuleSummaryStore(
    inner,
    cache.newTtlCache<StrictExitRuleSummary>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict exit rule summaries. Empty fields match all. */
export class StrictExitRuleSummaryQuery {
  segment: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictExitRuleSummary): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictExitRuleSummary[]): StrictExitRuleSummary[] {
    const matched = collections.filter(items, (candidate: StrictExitRuleSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictExitRuleSummaries(store: StrictExitRuleSummaryStore, query: StrictExitRuleSummaryQuery): StrictExitRuleSummary[] {
  return query.apply(store.list());
}
