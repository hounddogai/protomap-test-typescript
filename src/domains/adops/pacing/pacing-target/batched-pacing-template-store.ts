import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPacingTemplate } from "./batched-pacing-template.js";

/** Keeps batched pacing templates by code. */
export interface BatchedPacingTemplateStore {
  find(code: string): BatchedPacingTemplate | undefined;
  save(item: BatchedPacingTemplate): void;
  remove(code: string): boolean;
  list(): BatchedPacingTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPacingTemplateStore implements BatchedPacingTemplateStore {
  items: Map<string, BatchedPacingTemplate>;
  order: string[];

  constructor(items: Map<string, BatchedPacingTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPacingTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPacingTemplate): void {
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

  list(): BatchedPacingTemplate[] {
    const out: BatchedPacingTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPacingTemplateStore(): BatchedPacingTemplateStore {
  return new MemoryBatchedPacingTemplateStore(new Map<string, BatchedPacingTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPacingTemplateStore implements BatchedPacingTemplateStore {
  inner: BatchedPacingTemplateStore;
  cache: cache.TtlCache<BatchedPacingTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPacingTemplateStore,
    cacheValue: cache.TtlCache<BatchedPacingTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPacingTemplate | undefined {
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

  save(item: BatchedPacingTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPacingTemplate[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPacingTemplateStore(inner: BatchedPacingTemplateStore, ttl: number, clockValue: clock.Clock): BatchedPacingTemplateStore {
  return new CachedBatchedPacingTemplateStore(
    inner,
    cache.newTtlCache<BatchedPacingTemplate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched pacing templates. Empty fields match all. */
export class BatchedPacingTemplateQuery {
  source: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minMargin: number, statuses: string[], limit: number) {
    this.source = source;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPacingTemplate): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPacingTemplate[]): BatchedPacingTemplate[] {
    const matched = collections.filter(items, (candidate: BatchedPacingTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPacingTemplates(store: BatchedPacingTemplateStore, query: BatchedPacingTemplateQuery): BatchedPacingTemplate[] {
  return query.apply(store.list());
}
