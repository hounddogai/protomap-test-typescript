import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedDomainTemplate } from "./batched-domain-template.js";

/** Keeps batched domain templates by code. */
export interface BatchedDomainTemplateStore {
  find(code: string): BatchedDomainTemplate | undefined;
  save(item: BatchedDomainTemplate): void;
  remove(code: string): boolean;
  list(): BatchedDomainTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedDomainTemplateStore implements BatchedDomainTemplateStore {
  items: Map<string, BatchedDomainTemplate>;
  order: string[];

  constructor(items: Map<string, BatchedDomainTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedDomainTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedDomainTemplate): void {
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

  list(): BatchedDomainTemplate[] {
    const out: BatchedDomainTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedDomainTemplateStore(): BatchedDomainTemplateStore {
  return new MemoryBatchedDomainTemplateStore(new Map<string, BatchedDomainTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedDomainTemplateStore implements BatchedDomainTemplateStore {
  inner: BatchedDomainTemplateStore;
  cache: cache.TtlCache<BatchedDomainTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedDomainTemplateStore,
    cacheValue: cache.TtlCache<BatchedDomainTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedDomainTemplate | undefined {
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

  save(item: BatchedDomainTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedDomainTemplate[] {
    return this.inner.list();
  }
}

export function newCachedBatchedDomainTemplateStore(inner: BatchedDomainTemplateStore, ttl: number, clockValue: clock.Clock): BatchedDomainTemplateStore {
  return new CachedBatchedDomainTemplateStore(
    inner,
    cache.newTtlCache<BatchedDomainTemplate>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched domain templates. Empty fields match all. */
export class BatchedDomainTemplateQuery {
  label: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedDomainTemplate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedDomainTemplate[]): BatchedDomainTemplate[] {
    const matched = collections.filter(items, (candidate: BatchedDomainTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedDomainTemplates(store: BatchedDomainTemplateStore, query: BatchedDomainTemplateQuery): BatchedDomainTemplate[] {
  return query.apply(store.list());
}
