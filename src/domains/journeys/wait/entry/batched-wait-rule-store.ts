import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedWaitRule } from "./batched-wait-rule.js";

/** Keeps batched wait rules by code. */
export interface BatchedWaitRuleStore {
  find(code: string): BatchedWaitRule | undefined;
  save(item: BatchedWaitRule): void;
  remove(code: string): boolean;
  list(): BatchedWaitRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedWaitRuleStore implements BatchedWaitRuleStore {
  items: Map<string, BatchedWaitRule>;
  order: string[];

  constructor(items: Map<string, BatchedWaitRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedWaitRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedWaitRule): void {
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

  list(): BatchedWaitRule[] {
    const out: BatchedWaitRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedWaitRuleStore(): BatchedWaitRuleStore {
  return new MemoryBatchedWaitRuleStore(new Map<string, BatchedWaitRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedWaitRuleStore implements BatchedWaitRuleStore {
  inner: BatchedWaitRuleStore;
  cache: cache.TtlCache<BatchedWaitRule>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedWaitRuleStore,
    cacheValue: cache.TtlCache<BatchedWaitRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedWaitRule | undefined {
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

  save(item: BatchedWaitRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedWaitRule[] {
    return this.inner.list();
  }
}

export function newCachedBatchedWaitRuleStore(inner: BatchedWaitRuleStore, ttl: number, clockValue: clock.Clock): BatchedWaitRuleStore {
  return new CachedBatchedWaitRuleStore(inner, cache.newTtlCache<BatchedWaitRule>(256, ttl, clockValue), 0, 0);
}

/** Selects batched wait rules. Empty fields match all. */
export class BatchedWaitRuleQuery {
  title: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minVersion: number, statuses: string[], limit: number) {
    this.title = title;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedWaitRule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedWaitRule[]): BatchedWaitRule[] {
    const matched = collections.filter(items, (candidate: BatchedWaitRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedWaitRules(store: BatchedWaitRuleStore, query: BatchedWaitRuleQuery): BatchedWaitRule[] {
  return query.apply(store.list());
}
