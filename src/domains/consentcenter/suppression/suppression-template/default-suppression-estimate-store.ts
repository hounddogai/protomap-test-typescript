import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultSuppressionEstimate } from "./default-suppression-estimate.js";

/** Keeps default suppression estimates by code. */
export interface DefaultSuppressionEstimateStore {
  find(code: string): DefaultSuppressionEstimate | undefined;
  save(item: DefaultSuppressionEstimate): void;
  remove(code: string): boolean;
  list(): DefaultSuppressionEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultSuppressionEstimateStore implements DefaultSuppressionEstimateStore {
  items: Map<string, DefaultSuppressionEstimate>;
  order: string[];

  constructor(items: Map<string, DefaultSuppressionEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultSuppressionEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultSuppressionEstimate): void {
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

  list(): DefaultSuppressionEstimate[] {
    const out: DefaultSuppressionEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultSuppressionEstimateStore(): DefaultSuppressionEstimateStore {
  return new MemoryDefaultSuppressionEstimateStore(new Map<string, DefaultSuppressionEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultSuppressionEstimateStore implements DefaultSuppressionEstimateStore {
  inner: DefaultSuppressionEstimateStore;
  cache: cache.TtlCache<DefaultSuppressionEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultSuppressionEstimateStore,
    cacheValue: cache.TtlCache<DefaultSuppressionEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultSuppressionEstimate | undefined {
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

  save(item: DefaultSuppressionEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultSuppressionEstimate[] {
    return this.inner.list();
  }
}

export function newCachedDefaultSuppressionEstimateStore(inner: DefaultSuppressionEstimateStore, ttl: number, clockValue: clock.Clock): DefaultSuppressionEstimateStore {
  return new CachedDefaultSuppressionEstimateStore(
    inner,
    cache.newTtlCache<DefaultSuppressionEstimate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default suppression estimates. Empty fields match all. */
export class DefaultSuppressionEstimateQuery {
  title: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minImpressions: number, statuses: string[], limit: number) {
    this.title = title;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultSuppressionEstimate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultSuppressionEstimate[]): DefaultSuppressionEstimate[] {
    const matched = collections.filter(items, (candidate: DefaultSuppressionEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultSuppressionEstimates(store: DefaultSuppressionEstimateStore, query: DefaultSuppressionEstimateQuery): DefaultSuppressionEstimate[] {
  return query.apply(store.list());
}
