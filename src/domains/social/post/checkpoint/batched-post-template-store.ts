import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPostTemplate } from "./batched-post-template.js";

/** Keeps batched post templates by code. */
export interface BatchedPostTemplateStore {
  find(code: string): BatchedPostTemplate | undefined;
  save(item: BatchedPostTemplate): void;
  remove(code: string): boolean;
  list(): BatchedPostTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPostTemplateStore implements BatchedPostTemplateStore {
  items: Map<string, BatchedPostTemplate>;
  order: string[];

  constructor(items: Map<string, BatchedPostTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPostTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPostTemplate): void {
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

  list(): BatchedPostTemplate[] {
    const out: BatchedPostTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPostTemplateStore(): BatchedPostTemplateStore {
  return new MemoryBatchedPostTemplateStore(new Map<string, BatchedPostTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPostTemplateStore implements BatchedPostTemplateStore {
  inner: BatchedPostTemplateStore;
  cache: cache.TtlCache<BatchedPostTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPostTemplateStore,
    cacheValue: cache.TtlCache<BatchedPostTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPostTemplate | undefined {
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

  save(item: BatchedPostTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPostTemplate[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPostTemplateStore(inner: BatchedPostTemplateStore, ttl: number, clockValue: clock.Clock): BatchedPostTemplateStore {
  return new CachedBatchedPostTemplateStore(inner, cache.newTtlCache<BatchedPostTemplate>(128, ttl, clockValue), 0, 0);
}

/** Selects batched post templates. Empty fields match all. */
export class BatchedPostTemplateQuery {
  title: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWindowDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPostTemplate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPostTemplate[]): BatchedPostTemplate[] {
    const matched = collections.filter(items, (candidate: BatchedPostTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPostTemplates(store: BatchedPostTemplateStore, query: BatchedPostTemplateQuery): BatchedPostTemplate[] {
  return query.apply(store.list());
}
