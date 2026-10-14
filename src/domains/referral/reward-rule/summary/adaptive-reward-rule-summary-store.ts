import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveRewardRuleSummary } from "./adaptive-reward-rule-summary.js";

/** Keeps adaptive reward rule summaries by code. */
export interface AdaptiveRewardRuleSummaryStore {
  find(code: string): AdaptiveRewardRuleSummary | undefined;
  save(item: AdaptiveRewardRuleSummary): void;
  remove(code: string): boolean;
  list(): AdaptiveRewardRuleSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveRewardRuleSummaryStore implements AdaptiveRewardRuleSummaryStore {
  items: Map<string, AdaptiveRewardRuleSummary>;
  order: string[];

  constructor(items: Map<string, AdaptiveRewardRuleSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveRewardRuleSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveRewardRuleSummary): void {
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

  list(): AdaptiveRewardRuleSummary[] {
    const out: AdaptiveRewardRuleSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveRewardRuleSummaryStore(): AdaptiveRewardRuleSummaryStore {
  return new MemoryAdaptiveRewardRuleSummaryStore(new Map<string, AdaptiveRewardRuleSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveRewardRuleSummaryStore implements AdaptiveRewardRuleSummaryStore {
  inner: AdaptiveRewardRuleSummaryStore;
  cache: cache.TtlCache<AdaptiveRewardRuleSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveRewardRuleSummaryStore,
    cacheValue: cache.TtlCache<AdaptiveRewardRuleSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveRewardRuleSummary | undefined {
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

  save(item: AdaptiveRewardRuleSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveRewardRuleSummary[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveRewardRuleSummaryStore(inner: AdaptiveRewardRuleSummaryStore, ttl: number, clockValue: clock.Clock): AdaptiveRewardRuleSummaryStore {
  return new CachedAdaptiveRewardRuleSummaryStore(
    inner,
    cache.newTtlCache<AdaptiveRewardRuleSummary>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive reward rule summaries. Empty fields match all. */
export class AdaptiveRewardRuleSummaryQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveRewardRuleSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveRewardRuleSummary[]): AdaptiveRewardRuleSummary[] {
    const matched = collections.filter(items, (candidate: AdaptiveRewardRuleSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveRewardRuleSummaries(store: AdaptiveRewardRuleSummaryStore, query: AdaptiveRewardRuleSummaryQuery): AdaptiveRewardRuleSummary[] {
  return query.apply(store.list());
}
