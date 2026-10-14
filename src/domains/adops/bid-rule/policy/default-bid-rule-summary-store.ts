import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultBidRuleSummary } from "./default-bid-rule-summary.js";

/** Keeps default bid rule summaries by code. */
export interface DefaultBidRuleSummaryStore {
  find(code: string): DefaultBidRuleSummary | undefined;
  save(item: DefaultBidRuleSummary): void;
  remove(code: string): boolean;
  list(): DefaultBidRuleSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultBidRuleSummaryStore implements DefaultBidRuleSummaryStore {
  items: Map<string, DefaultBidRuleSummary>;
  order: string[];

  constructor(items: Map<string, DefaultBidRuleSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultBidRuleSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultBidRuleSummary): void {
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

  list(): DefaultBidRuleSummary[] {
    const out: DefaultBidRuleSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultBidRuleSummaryStore(): DefaultBidRuleSummaryStore {
  return new MemoryDefaultBidRuleSummaryStore(new Map<string, DefaultBidRuleSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultBidRuleSummaryStore implements DefaultBidRuleSummaryStore {
  inner: DefaultBidRuleSummaryStore;
  cache: cache.TtlCache<DefaultBidRuleSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultBidRuleSummaryStore,
    cacheValue: cache.TtlCache<DefaultBidRuleSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultBidRuleSummary | undefined {
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

  save(item: DefaultBidRuleSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultBidRuleSummary[] {
    return this.inner.list();
  }
}

export function newCachedDefaultBidRuleSummaryStore(inner: DefaultBidRuleSummaryStore, ttl: number, clockValue: clock.Clock): DefaultBidRuleSummaryStore {
  return new CachedDefaultBidRuleSummaryStore(
    inner,
    cache.newTtlCache<DefaultBidRuleSummary>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default bid rule summaries. Empty fields match all. */
export class DefaultBidRuleSummaryQuery {
  label: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSequence: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultBidRuleSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultBidRuleSummary[]): DefaultBidRuleSummary[] {
    const matched = collections.filter(items, (candidate: DefaultBidRuleSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultBidRuleSummaries(store: DefaultBidRuleSummaryStore, query: DefaultBidRuleSummaryQuery): DefaultBidRuleSummary[] {
  return query.apply(store.list());
}
