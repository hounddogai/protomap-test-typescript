import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementTemplate } from "./placement-template.js";

/** Keeps placement templates by code. */
export interface PlacementTemplateStore {
  find(code: string): PlacementTemplate | undefined;
  save(item: PlacementTemplate): void;
  remove(code: string): boolean;
  list(): PlacementTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementTemplateStore implements PlacementTemplateStore {
  items: Map<string, PlacementTemplate>;
  order: string[];

  constructor(items: Map<string, PlacementTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementTemplate): void {
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

  list(): PlacementTemplate[] {
    const out: PlacementTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementTemplateStore(): PlacementTemplateStore {
  return new MemoryPlacementTemplateStore(new Map<string, PlacementTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementTemplateStore implements PlacementTemplateStore {
  inner: PlacementTemplateStore;
  cache: cache.TtlCache<PlacementTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementTemplateStore,
    cacheValue: cache.TtlCache<PlacementTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementTemplate | undefined {
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

  save(item: PlacementTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementTemplate[] {
    return this.inner.list();
  }
}

export function newCachedPlacementTemplateStore(inner: PlacementTemplateStore, ttl: number, clockValue: clock.Clock): PlacementTemplateStore {
  return new CachedPlacementTemplateStore(inner, cache.newTtlCache<PlacementTemplate>(64, ttl, clockValue), 0, 0);
}

/** Selects placement templates. Empty fields match all. */
export class PlacementTemplateQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementTemplate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementTemplate[]): PlacementTemplate[] {
    const matched = collections.filter(items, (candidate: PlacementTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementTemplates(store: PlacementTemplateStore, query: PlacementTemplateQuery): PlacementTemplate[] {
  return query.apply(store.list());
}
