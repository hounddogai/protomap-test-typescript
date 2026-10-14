import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedExitRuleMapping } from "./batched-exit-rule-mapping.js";

/** Keeps batched exit rule mappings by code. */
export interface BatchedExitRuleMappingStore {
  find(code: string): BatchedExitRuleMapping | undefined;
  save(item: BatchedExitRuleMapping): void;
  remove(code: string): boolean;
  list(): BatchedExitRuleMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedExitRuleMappingStore implements BatchedExitRuleMappingStore {
  items: Map<string, BatchedExitRuleMapping>;
  order: string[];

  constructor(items: Map<string, BatchedExitRuleMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedExitRuleMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedExitRuleMapping): void {
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

  list(): BatchedExitRuleMapping[] {
    const out: BatchedExitRuleMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedExitRuleMappingStore(): BatchedExitRuleMappingStore {
  return new MemoryBatchedExitRuleMappingStore(new Map<string, BatchedExitRuleMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedExitRuleMappingStore implements BatchedExitRuleMappingStore {
  inner: BatchedExitRuleMappingStore;
  cache: cache.TtlCache<BatchedExitRuleMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedExitRuleMappingStore,
    cacheValue: cache.TtlCache<BatchedExitRuleMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedExitRuleMapping | undefined {
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

  save(item: BatchedExitRuleMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedExitRuleMapping[] {
    return this.inner.list();
  }
}

export function newCachedBatchedExitRuleMappingStore(inner: BatchedExitRuleMappingStore, ttl: number, clockValue: clock.Clock): BatchedExitRuleMappingStore {
  return new CachedBatchedExitRuleMappingStore(
    inner,
    cache.newTtlCache<BatchedExitRuleMapping>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched exit rule mappings. Empty fields match all. */
export class BatchedExitRuleMappingQuery {
  locale: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minOpenRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedExitRuleMapping): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedExitRuleMapping[]): BatchedExitRuleMapping[] {
    const matched = collections.filter(items, (candidate: BatchedExitRuleMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedExitRuleMappings(store: BatchedExitRuleMappingStore, query: BatchedExitRuleMappingQuery): BatchedExitRuleMapping[] {
  return query.apply(store.list());
}
