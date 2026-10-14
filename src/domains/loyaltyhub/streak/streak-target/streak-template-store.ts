import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakTemplate } from "./streak-template.js";

/** Keeps streak templates by code. */
export interface StreakTemplateStore {
  find(code: string): StreakTemplate | undefined;
  save(item: StreakTemplate): void;
  remove(code: string): boolean;
  list(): StreakTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakTemplateStore implements StreakTemplateStore {
  items: Map<string, StreakTemplate>;
  order: string[];

  constructor(items: Map<string, StreakTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakTemplate): void {
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

  list(): StreakTemplate[] {
    const out: StreakTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakTemplateStore(): StreakTemplateStore {
  return new MemoryStreakTemplateStore(new Map<string, StreakTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakTemplateStore implements StreakTemplateStore {
  inner: StreakTemplateStore;
  cache: cache.TtlCache<StreakTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: StreakTemplateStore,
    cacheValue: cache.TtlCache<StreakTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakTemplate | undefined {
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

  save(item: StreakTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakTemplate[] {
    return this.inner.list();
  }
}

export function newCachedStreakTemplateStore(inner: StreakTemplateStore, ttl: number, clockValue: clock.Clock): StreakTemplateStore {
  return new CachedStreakTemplateStore(inner, cache.newTtlCache<StreakTemplate>(128, ttl, clockValue), 0, 0);
}

/** Selects streak templates. Empty fields match all. */
export class StreakTemplateQuery {
  region: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minClicks: number, statuses: string[], limit: number) {
    this.region = region;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakTemplate): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakTemplate[]): StreakTemplate[] {
    const matched = collections.filter(items, (candidate: StreakTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakTemplates(store: StreakTemplateStore, query: StreakTemplateQuery): StreakTemplate[] {
  return query.apply(store.list());
}
