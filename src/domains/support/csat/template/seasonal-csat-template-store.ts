import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalCsatTemplate } from "./seasonal-csat-template.js";

/** Keeps seasonal csat templates by code. */
export interface SeasonalCsatTemplateStore {
  find(code: string): SeasonalCsatTemplate | undefined;
  save(item: SeasonalCsatTemplate): void;
  remove(code: string): boolean;
  list(): SeasonalCsatTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalCsatTemplateStore implements SeasonalCsatTemplateStore {
  items: Map<string, SeasonalCsatTemplate>;
  order: string[];

  constructor(items: Map<string, SeasonalCsatTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalCsatTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalCsatTemplate): void {
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

  list(): SeasonalCsatTemplate[] {
    const out: SeasonalCsatTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalCsatTemplateStore(): SeasonalCsatTemplateStore {
  return new MemorySeasonalCsatTemplateStore(new Map<string, SeasonalCsatTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalCsatTemplateStore implements SeasonalCsatTemplateStore {
  inner: SeasonalCsatTemplateStore;
  cache: cache.TtlCache<SeasonalCsatTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalCsatTemplateStore,
    cacheValue: cache.TtlCache<SeasonalCsatTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalCsatTemplate | undefined {
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

  save(item: SeasonalCsatTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalCsatTemplate[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalCsatTemplateStore(inner: SeasonalCsatTemplateStore, ttl: number, clockValue: clock.Clock): SeasonalCsatTemplateStore {
  return new CachedSeasonalCsatTemplateStore(
    inner,
    cache.newTtlCache<SeasonalCsatTemplate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal csat templates. Empty fields match all. */
export class SeasonalCsatTemplateQuery {
  country: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalCsatTemplate): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalCsatTemplate[]): SeasonalCsatTemplate[] {
    const matched = collections.filter(items, (candidate: SeasonalCsatTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalCsatTemplates(store: SeasonalCsatTemplateStore, query: SeasonalCsatTemplateQuery): SeasonalCsatTemplate[] {
  return query.apply(store.list());
}
