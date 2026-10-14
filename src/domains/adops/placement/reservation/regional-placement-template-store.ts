import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPlacementTemplate } from "./regional-placement-template.js";

/** Keeps regional placement templates by code. */
export interface RegionalPlacementTemplateStore {
  find(code: string): RegionalPlacementTemplate | undefined;
  save(item: RegionalPlacementTemplate): void;
  remove(code: string): boolean;
  list(): RegionalPlacementTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPlacementTemplateStore implements RegionalPlacementTemplateStore {
  items: Map<string, RegionalPlacementTemplate>;
  order: string[];

  constructor(items: Map<string, RegionalPlacementTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPlacementTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPlacementTemplate): void {
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

  list(): RegionalPlacementTemplate[] {
    const out: RegionalPlacementTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPlacementTemplateStore(): RegionalPlacementTemplateStore {
  return new MemoryRegionalPlacementTemplateStore(new Map<string, RegionalPlacementTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPlacementTemplateStore implements RegionalPlacementTemplateStore {
  inner: RegionalPlacementTemplateStore;
  cache: cache.TtlCache<RegionalPlacementTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPlacementTemplateStore,
    cacheValue: cache.TtlCache<RegionalPlacementTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPlacementTemplate | undefined {
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

  save(item: RegionalPlacementTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPlacementTemplate[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPlacementTemplateStore(inner: RegionalPlacementTemplateStore, ttl: number, clockValue: clock.Clock): RegionalPlacementTemplateStore {
  return new CachedRegionalPlacementTemplateStore(
    inner,
    cache.newTtlCache<RegionalPlacementTemplate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional placement templates. Empty fields match all. */
export class RegionalPlacementTemplateQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalPlacementTemplate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPlacementTemplate[]): RegionalPlacementTemplate[] {
    const matched = collections.filter(items, (candidate: RegionalPlacementTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPlacementTemplates(store: RegionalPlacementTemplateStore, query: RegionalPlacementTemplateQuery): RegionalPlacementTemplate[] {
  return query.apply(store.list());
}
