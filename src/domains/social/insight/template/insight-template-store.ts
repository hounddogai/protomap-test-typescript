import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightTemplate } from "./insight-template.js";

/** Keeps insight templates by code. */
export interface InsightTemplateStore {
  find(code: string): InsightTemplate | undefined;
  save(item: InsightTemplate): void;
  remove(code: string): boolean;
  list(): InsightTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightTemplateStore implements InsightTemplateStore {
  items: Map<string, InsightTemplate>;
  order: string[];

  constructor(items: Map<string, InsightTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightTemplate): void {
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

  list(): InsightTemplate[] {
    const out: InsightTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightTemplateStore(): InsightTemplateStore {
  return new MemoryInsightTemplateStore(new Map<string, InsightTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightTemplateStore implements InsightTemplateStore {
  inner: InsightTemplateStore;
  cache: cache.TtlCache<InsightTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightTemplateStore,
    cacheValue: cache.TtlCache<InsightTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightTemplate | undefined {
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

  save(item: InsightTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightTemplate[] {
    return this.inner.list();
  }
}

export function newCachedInsightTemplateStore(inner: InsightTemplateStore, ttl: number, clockValue: clock.Clock): InsightTemplateStore {
  return new CachedInsightTemplateStore(inner, cache.newTtlCache<InsightTemplate>(1024, ttl, clockValue), 0, 0);
}

/** Selects insight templates. Empty fields match all. */
export class InsightTemplateQuery {
  segment: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMargin: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightTemplate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightTemplate[]): InsightTemplate[] {
    const matched = collections.filter(items, (candidate: InsightTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightTemplates(store: InsightTemplateStore, query: InsightTemplateQuery): InsightTemplate[] {
  return query.apply(store.list());
}
