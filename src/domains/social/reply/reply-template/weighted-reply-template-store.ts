import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedReplyTemplate } from "./weighted-reply-template.js";

/** Keeps weighted reply templates by code. */
export interface WeightedReplyTemplateStore {
  find(code: string): WeightedReplyTemplate | undefined;
  save(item: WeightedReplyTemplate): void;
  remove(code: string): boolean;
  list(): WeightedReplyTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedReplyTemplateStore implements WeightedReplyTemplateStore {
  items: Map<string, WeightedReplyTemplate>;
  order: string[];

  constructor(items: Map<string, WeightedReplyTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedReplyTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedReplyTemplate): void {
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

  list(): WeightedReplyTemplate[] {
    const out: WeightedReplyTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedReplyTemplateStore(): WeightedReplyTemplateStore {
  return new MemoryWeightedReplyTemplateStore(new Map<string, WeightedReplyTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedReplyTemplateStore implements WeightedReplyTemplateStore {
  inner: WeightedReplyTemplateStore;
  cache: cache.TtlCache<WeightedReplyTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedReplyTemplateStore,
    cacheValue: cache.TtlCache<WeightedReplyTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedReplyTemplate | undefined {
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

  save(item: WeightedReplyTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedReplyTemplate[] {
    return this.inner.list();
  }
}

export function newCachedWeightedReplyTemplateStore(inner: WeightedReplyTemplateStore, ttl: number, clockValue: clock.Clock): WeightedReplyTemplateStore {
  return new CachedWeightedReplyTemplateStore(
    inner,
    cache.newTtlCache<WeightedReplyTemplate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reply templates. Empty fields match all. */
export class WeightedReplyTemplateQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedReplyTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedReplyTemplate[]): WeightedReplyTemplate[] {
    const matched = collections.filter(items, (candidate: WeightedReplyTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedReplyTemplates(store: WeightedReplyTemplateStore, query: WeightedReplyTemplateQuery): WeightedReplyTemplate[] {
  return query.apply(store.list());
}
