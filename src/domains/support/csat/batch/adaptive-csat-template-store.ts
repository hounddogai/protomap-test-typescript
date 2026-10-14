import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveCsatTemplate } from "./adaptive-csat-template.js";

/** Keeps adaptive csat templates by code. */
export interface AdaptiveCsatTemplateStore {
  find(code: string): AdaptiveCsatTemplate | undefined;
  save(item: AdaptiveCsatTemplate): void;
  remove(code: string): boolean;
  list(): AdaptiveCsatTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveCsatTemplateStore implements AdaptiveCsatTemplateStore {
  items: Map<string, AdaptiveCsatTemplate>;
  order: string[];

  constructor(items: Map<string, AdaptiveCsatTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveCsatTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveCsatTemplate): void {
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

  list(): AdaptiveCsatTemplate[] {
    const out: AdaptiveCsatTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveCsatTemplateStore(): AdaptiveCsatTemplateStore {
  return new MemoryAdaptiveCsatTemplateStore(new Map<string, AdaptiveCsatTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveCsatTemplateStore implements AdaptiveCsatTemplateStore {
  inner: AdaptiveCsatTemplateStore;
  cache: cache.TtlCache<AdaptiveCsatTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveCsatTemplateStore,
    cacheValue: cache.TtlCache<AdaptiveCsatTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveCsatTemplate | undefined {
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

  save(item: AdaptiveCsatTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveCsatTemplate[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveCsatTemplateStore(inner: AdaptiveCsatTemplateStore, ttl: number, clockValue: clock.Clock): AdaptiveCsatTemplateStore {
  return new CachedAdaptiveCsatTemplateStore(
    inner,
    cache.newTtlCache<AdaptiveCsatTemplate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive csat templates. Empty fields match all. */
export class AdaptiveCsatTemplateQuery {
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

  matches(item: AdaptiveCsatTemplate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveCsatTemplate[]): AdaptiveCsatTemplate[] {
    const matched = collections.filter(items, (candidate: AdaptiveCsatTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveCsatTemplates(store: AdaptiveCsatTemplateStore, query: AdaptiveCsatTemplateQuery): AdaptiveCsatTemplate[] {
  return query.apply(store.list());
}
