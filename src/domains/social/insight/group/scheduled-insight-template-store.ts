import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledInsightTemplate } from "./scheduled-insight-template.js";

/** Keeps scheduled insight templates by code. */
export interface ScheduledInsightTemplateStore {
  find(code: string): ScheduledInsightTemplate | undefined;
  save(item: ScheduledInsightTemplate): void;
  remove(code: string): boolean;
  list(): ScheduledInsightTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledInsightTemplateStore implements ScheduledInsightTemplateStore {
  items: Map<string, ScheduledInsightTemplate>;
  order: string[];

  constructor(items: Map<string, ScheduledInsightTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledInsightTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledInsightTemplate): void {
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

  list(): ScheduledInsightTemplate[] {
    const out: ScheduledInsightTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledInsightTemplateStore(): ScheduledInsightTemplateStore {
  return new MemoryScheduledInsightTemplateStore(new Map<string, ScheduledInsightTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledInsightTemplateStore implements ScheduledInsightTemplateStore {
  inner: ScheduledInsightTemplateStore;
  cache: cache.TtlCache<ScheduledInsightTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledInsightTemplateStore,
    cacheValue: cache.TtlCache<ScheduledInsightTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledInsightTemplate | undefined {
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

  save(item: ScheduledInsightTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledInsightTemplate[] {
    return this.inner.list();
  }
}

export function newCachedScheduledInsightTemplateStore(inner: ScheduledInsightTemplateStore, ttl: number, clockValue: clock.Clock): ScheduledInsightTemplateStore {
  return new CachedScheduledInsightTemplateStore(
    inner,
    cache.newTtlCache<ScheduledInsightTemplate>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled insight templates. Empty fields match all. */
export class ScheduledInsightTemplateQuery {
  unit: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMinimum: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledInsightTemplate): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledInsightTemplate[]): ScheduledInsightTemplate[] {
    const matched = collections.filter(items, (candidate: ScheduledInsightTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledInsightTemplates(store: ScheduledInsightTemplateStore, query: ScheduledInsightTemplateQuery): ScheduledInsightTemplate[] {
  return query.apply(store.list());
}
