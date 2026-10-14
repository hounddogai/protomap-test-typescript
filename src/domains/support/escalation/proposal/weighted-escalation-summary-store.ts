import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedEscalationSummary } from "./weighted-escalation-summary.js";

/** Keeps weighted escalation summaries by code. */
export interface WeightedEscalationSummaryStore {
  find(code: string): WeightedEscalationSummary | undefined;
  save(item: WeightedEscalationSummary): void;
  remove(code: string): boolean;
  list(): WeightedEscalationSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedEscalationSummaryStore implements WeightedEscalationSummaryStore {
  items: Map<string, WeightedEscalationSummary>;
  order: string[];

  constructor(items: Map<string, WeightedEscalationSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedEscalationSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedEscalationSummary): void {
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

  list(): WeightedEscalationSummary[] {
    const out: WeightedEscalationSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedEscalationSummaryStore(): WeightedEscalationSummaryStore {
  return new MemoryWeightedEscalationSummaryStore(new Map<string, WeightedEscalationSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedEscalationSummaryStore implements WeightedEscalationSummaryStore {
  inner: WeightedEscalationSummaryStore;
  cache: cache.TtlCache<WeightedEscalationSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedEscalationSummaryStore,
    cacheValue: cache.TtlCache<WeightedEscalationSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedEscalationSummary | undefined {
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

  save(item: WeightedEscalationSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedEscalationSummary[] {
    return this.inner.list();
  }
}

export function newCachedWeightedEscalationSummaryStore(inner: WeightedEscalationSummaryStore, ttl: number, clockValue: clock.Clock): WeightedEscalationSummaryStore {
  return new CachedWeightedEscalationSummaryStore(
    inner,
    cache.newTtlCache<WeightedEscalationSummary>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted escalation summaries. Empty fields match all. */
export class WeightedEscalationSummaryQuery {
  label: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedEscalationSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedEscalationSummary[]): WeightedEscalationSummary[] {
    const matched = collections.filter(items, (candidate: WeightedEscalationSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedEscalationSummaries(store: WeightedEscalationSummaryStore, query: WeightedEscalationSummaryQuery): WeightedEscalationSummary[] {
  return query.apply(store.list());
}
