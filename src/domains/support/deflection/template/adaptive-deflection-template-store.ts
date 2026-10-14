import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveDeflectionTemplate } from "./adaptive-deflection-template.js";

/** Keeps adaptive deflection templates by code. */
export interface AdaptiveDeflectionTemplateStore {
  find(code: string): AdaptiveDeflectionTemplate | undefined;
  save(item: AdaptiveDeflectionTemplate): void;
  remove(code: string): boolean;
  list(): AdaptiveDeflectionTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveDeflectionTemplateStore implements AdaptiveDeflectionTemplateStore {
  items: Map<string, AdaptiveDeflectionTemplate>;
  order: string[];

  constructor(items: Map<string, AdaptiveDeflectionTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveDeflectionTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveDeflectionTemplate): void {
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

  list(): AdaptiveDeflectionTemplate[] {
    const out: AdaptiveDeflectionTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveDeflectionTemplateStore(): AdaptiveDeflectionTemplateStore {
  return new MemoryAdaptiveDeflectionTemplateStore(new Map<string, AdaptiveDeflectionTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveDeflectionTemplateStore implements AdaptiveDeflectionTemplateStore {
  inner: AdaptiveDeflectionTemplateStore;
  cache: cache.TtlCache<AdaptiveDeflectionTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveDeflectionTemplateStore,
    cacheValue: cache.TtlCache<AdaptiveDeflectionTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveDeflectionTemplate | undefined {
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

  save(item: AdaptiveDeflectionTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveDeflectionTemplate[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveDeflectionTemplateStore(inner: AdaptiveDeflectionTemplateStore, ttl: number, clockValue: clock.Clock): AdaptiveDeflectionTemplateStore {
  return new CachedAdaptiveDeflectionTemplateStore(
    inner,
    cache.newTtlCache<AdaptiveDeflectionTemplate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive deflection templates. Empty fields match all. */
export class AdaptiveDeflectionTemplateQuery {
  title: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAmount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveDeflectionTemplate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveDeflectionTemplate[]): AdaptiveDeflectionTemplate[] {
    const matched = collections.filter(items, (candidate: AdaptiveDeflectionTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveDeflectionTemplates(store: AdaptiveDeflectionTemplateStore, query: AdaptiveDeflectionTemplateQuery): AdaptiveDeflectionTemplate[] {
  return query.apply(store.list());
}
