import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedEnrollmentTemplate } from "./batched-enrollment-template.js";

/** Keeps batched enrollment templates by code. */
export interface BatchedEnrollmentTemplateStore {
  find(code: string): BatchedEnrollmentTemplate | undefined;
  save(item: BatchedEnrollmentTemplate): void;
  remove(code: string): boolean;
  list(): BatchedEnrollmentTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedEnrollmentTemplateStore implements BatchedEnrollmentTemplateStore {
  items: Map<string, BatchedEnrollmentTemplate>;
  order: string[];

  constructor(items: Map<string, BatchedEnrollmentTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedEnrollmentTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedEnrollmentTemplate): void {
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

  list(): BatchedEnrollmentTemplate[] {
    const out: BatchedEnrollmentTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedEnrollmentTemplateStore(): BatchedEnrollmentTemplateStore {
  return new MemoryBatchedEnrollmentTemplateStore(new Map<string, BatchedEnrollmentTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedEnrollmentTemplateStore implements BatchedEnrollmentTemplateStore {
  inner: BatchedEnrollmentTemplateStore;
  cache: cache.TtlCache<BatchedEnrollmentTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedEnrollmentTemplateStore,
    cacheValue: cache.TtlCache<BatchedEnrollmentTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedEnrollmentTemplate | undefined {
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

  save(item: BatchedEnrollmentTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedEnrollmentTemplate[] {
    return this.inner.list();
  }
}

export function newCachedBatchedEnrollmentTemplateStore(inner: BatchedEnrollmentTemplateStore, ttl: number, clockValue: clock.Clock): BatchedEnrollmentTemplateStore {
  return new CachedBatchedEnrollmentTemplateStore(
    inner,
    cache.newTtlCache<BatchedEnrollmentTemplate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched enrollment templates. Empty fields match all. */
export class BatchedEnrollmentTemplateQuery {
  label: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedEnrollmentTemplate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedEnrollmentTemplate[]): BatchedEnrollmentTemplate[] {
    const matched = collections.filter(items, (candidate: BatchedEnrollmentTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedEnrollmentTemplates(store: BatchedEnrollmentTemplateStore, query: BatchedEnrollmentTemplateQuery): BatchedEnrollmentTemplate[] {
  return query.apply(store.list());
}
