import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedJourneyTemplate } from "./batched-journey-template.js";

/** Keeps batched journey templates by code. */
export interface BatchedJourneyTemplateStore {
  find(code: string): BatchedJourneyTemplate | undefined;
  save(item: BatchedJourneyTemplate): void;
  remove(code: string): boolean;
  list(): BatchedJourneyTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedJourneyTemplateStore implements BatchedJourneyTemplateStore {
  items: Map<string, BatchedJourneyTemplate>;
  order: string[];

  constructor(items: Map<string, BatchedJourneyTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedJourneyTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedJourneyTemplate): void {
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

  list(): BatchedJourneyTemplate[] {
    const out: BatchedJourneyTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedJourneyTemplateStore(): BatchedJourneyTemplateStore {
  return new MemoryBatchedJourneyTemplateStore(new Map<string, BatchedJourneyTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedJourneyTemplateStore implements BatchedJourneyTemplateStore {
  inner: BatchedJourneyTemplateStore;
  cache: cache.TtlCache<BatchedJourneyTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedJourneyTemplateStore,
    cacheValue: cache.TtlCache<BatchedJourneyTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedJourneyTemplate | undefined {
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

  save(item: BatchedJourneyTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedJourneyTemplate[] {
    return this.inner.list();
  }
}

export function newCachedBatchedJourneyTemplateStore(inner: BatchedJourneyTemplateStore, ttl: number, clockValue: clock.Clock): BatchedJourneyTemplateStore {
  return new CachedBatchedJourneyTemplateStore(
    inner,
    cache.newTtlCache<BatchedJourneyTemplate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched journey templates. Empty fields match all. */
export class BatchedJourneyTemplateQuery {
  country: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minWeight: number, statuses: string[], limit: number) {
    this.country = country;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedJourneyTemplate): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedJourneyTemplate[]): BatchedJourneyTemplate[] {
    const matched = collections.filter(items, (candidate: BatchedJourneyTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedJourneyTemplates(store: BatchedJourneyTemplateStore, query: BatchedJourneyTemplateQuery): BatchedJourneyTemplate[] {
  return query.apply(store.list());
}
