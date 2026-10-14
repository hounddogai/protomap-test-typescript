import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledWarmupTemplate } from "./scheduled-warmup-template.js";

/** Keeps scheduled warmup templates by code. */
export interface ScheduledWarmupTemplateStore {
  find(code: string): ScheduledWarmupTemplate | undefined;
  save(item: ScheduledWarmupTemplate): void;
  remove(code: string): boolean;
  list(): ScheduledWarmupTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledWarmupTemplateStore implements ScheduledWarmupTemplateStore {
  items: Map<string, ScheduledWarmupTemplate>;
  order: string[];

  constructor(items: Map<string, ScheduledWarmupTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledWarmupTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledWarmupTemplate): void {
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

  list(): ScheduledWarmupTemplate[] {
    const out: ScheduledWarmupTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledWarmupTemplateStore(): ScheduledWarmupTemplateStore {
  return new MemoryScheduledWarmupTemplateStore(new Map<string, ScheduledWarmupTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledWarmupTemplateStore implements ScheduledWarmupTemplateStore {
  inner: ScheduledWarmupTemplateStore;
  cache: cache.TtlCache<ScheduledWarmupTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledWarmupTemplateStore,
    cacheValue: cache.TtlCache<ScheduledWarmupTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledWarmupTemplate | undefined {
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

  save(item: ScheduledWarmupTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledWarmupTemplate[] {
    return this.inner.list();
  }
}

export function newCachedScheduledWarmupTemplateStore(inner: ScheduledWarmupTemplateStore, ttl: number, clockValue: clock.Clock): ScheduledWarmupTemplateStore {
  return new CachedScheduledWarmupTemplateStore(
    inner,
    cache.newTtlCache<ScheduledWarmupTemplate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled warmup templates. Empty fields match all. */
export class ScheduledWarmupTemplateQuery {
  locale: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMargin: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledWarmupTemplate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledWarmupTemplate[]): ScheduledWarmupTemplate[] {
    const matched = collections.filter(items, (candidate: ScheduledWarmupTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledWarmupTemplates(store: ScheduledWarmupTemplateStore, query: ScheduledWarmupTemplateQuery): ScheduledWarmupTemplate[] {
  return query.apply(store.list());
}
